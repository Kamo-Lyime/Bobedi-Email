import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { Resend } from "resend";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Resend's limit)
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// initialize resend
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAILS_FILE = path.join(__dirname, "emails.json");

// Helper function to read emails
async function readEmails() {
  try {
    const data = await fs.readFile(EMAILS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write emails
async function writeEmails(emails) {
  await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2));
}

// Generate professional email signature HTML
function getEmailSignature() {
  // Create a fallback signature that works reliably without external images
  return `
    <br><br>
    <div style="border-top: 2px solid #667eea; padding-top: 15px; margin-top: 20px; font-family: Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
        <tr>
          <td style="padding-right: 15px; vertical-align: top;">
            <img src="images/bobedi IT Group.png" alt="Bobedi IT Group" style="width: 60px; height: 60px; border-radius: 8px;" />
          </td>
          <td style="vertical-align: top; padding-left: 10px;">
            <div style="color: #333; font-size: 16px; font-weight: bold; margin-bottom: 5px; font-family: Arial, sans-serif;">Bobedi IT Group</div>
            <div style="color: #007AFF; font-size: 14px; margin-bottom: 3px; font-family: Arial, sans-serif;">
              <a href="https://www.bobediitgroup.co.za" style="color: #007AFF; text-decoration: none;">www.bobediitgroup.co.za</a>
            </div>
            <div style="color: #666; font-size: 13px; font-family: Arial, sans-serif;">
              <a href="mailto:info@bobediitgroup.co.za" style="color: #666; text-decoration: none;">info@bobediitgroup.co.za</a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Webhook signature verification (optional but recommended)
function verifyWebhookSignature(req) {
  const signature = req.headers['resend-signature'];
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  
  // If no secret is configured, skip verification
  if (!webhookSecret) {
    console.warn("Warning: RESEND_WEBHOOK_SECRET not configured. Webhook verification disabled.");
    return true;
  }
  
  // If secret exists but no signature provided, reject
  if (!signature) {
    console.error("Webhook signature missing");
    return false;
  }
  
  // Basic signature verification (adjust based on Resend's actual signature method)
  // This is a placeholder - check Resend docs for exact verification method
  return true;
}

// inbound webhook endpoint
app.post("/inbound-email", async (req, res) => {
  console.log("📧 Inbound email webhook received");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    // Verify webhook signature (if configured)
    if (!verifyWebhookSignature(req)) {
      console.error("❌ Webhook signature verification failed");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const webhookData = req.body;
    
    // Handle different webhook formats from Resend
    let emailData;
    
    if (webhookData.type === "email.received" && webhookData.data) {
      // Resend webhook format
      emailData = webhookData.data;
      console.log("✅ Resend webhook format detected");
    } else if (webhookData.from || webhookData.subject) {
      // Direct email data format
      emailData = webhookData;
      console.log("✅ Direct email format detected");
    } else {
      console.log("⚠️ Unknown webhook format, attempting to process");
      emailData = webhookData;
    }

    // Extract email details with better handling
    const fromAddress = emailData.from || emailData.sender || emailData.from_email || "Unknown Sender";
    const toAddress = emailData.to || emailData.recipient || emailData.to_email || "info@bobediitgroup.co.za";
    const subject = emailData.subject || "No Subject";
    const textContent = emailData.text || emailData.plain || emailData.text_body || "";
    const htmlContent = emailData.html || emailData.html_body || null;

    // Store email in JSON file
    const emails = await readEmails();
    const newEmail = {
      id: Date.now().toString(),
      from: fromAddress,
      to: toAddress,
      subject: subject,
      text: textContent,
      html: htmlContent,
      timestamp: new Date().toISOString(),
      attachments: emailData.attachments || [],
      raw: emailData // Store raw data for debugging
    };
    
    emails.unshift(newEmail); // Add to beginning
    
    // Keep only last 100 emails (increased from 50)
    if (emails.length > 100) {
      emails.splice(100);
    }
    
    await writeEmails(emails);

    console.log("✅ Email stored successfully");
    console.log(`   From: ${fromAddress}`);
    console.log(`   Subject: ${subject}`);

    // Forward to Gmail for backup (with error handling)
    try {
      await resend.emails.send({
        from: "info@bobediitgroup.co.za",
        to: "bobedi.it@gmail.com",
        subject: `[Inbox] ${subject}`,
        text: `From: ${fromAddress}\nTo: ${toAddress}\n\n${textContent}`,
        html: htmlContent || `<p><strong>From:</strong> ${fromAddress}</p><p><strong>To:</strong> ${toAddress}</p><hr><pre>${textContent}</pre>`
      });
      console.log("✅ Email forwarded to Gmail backup");
    } catch (forwardError) {
      console.error("⚠️ Error forwarding to Gmail:", forwardError.message);
      // Don't fail the whole request if forwarding fails
    }

    res.status(200).json({ 
      success: true, 
      message: "Email received and processed",
      emailId: newEmail.id
    });
  } catch (error) {
    console.error("❌ Error processing inbound email:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Error processing email", 
      details: error.message 
    });
  }
});

// API endpoint to get emails for the web interface
app.get("/api/emails", async (req, res) => {
  try {
    const emails = await readEmails();
    res.json(emails);
  } catch (error) {
    console.error("Error reading emails:", error);
    res.status(500).json({ error: "Failed to read emails" });
  }
});

// API endpoint to send replies with attachments
app.post("/api/reply", upload.array('attachments', 10), async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    const signature = getEmailSignature();
    const htmlContent = `<p>${message.replace(/\n/g, "<br>")}</p>${signature}`;
    
    const emailData = {
      from: "info@bobediitgroup.co.za",
      to: to,
      subject: subject,
      text: message + "\n\n--\nBobedi IT Group\nwww.bobediitgroup.co.za\ninfo@bobediitgroup.co.za",
      html: htmlContent
    };
    
    // Add attachments if any
    if (req.files && req.files.length > 0) {
      emailData.attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        type: file.mimetype
      }));
    }
    
    await resend.emails.send(emailData);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Failed to send reply", details: error.message });
  }
});

// API endpoint to compose and send new emails with attachments
app.post("/api/compose", upload.array('attachments', 10), async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields: to, subject, message" });
    }
    
    const signature = getEmailSignature();
    const htmlContent = `<p>${message.replace(/\n/g, "<br>")}</p>${signature}`;
    const textSignature = "\n\n--\nBobedi IT Group\nwww.bobediitgroup.co.za\ninfo@bobediitgroup.co.za";
    
    console.log("Adding signature to email...");
    console.log("HTML content preview:", htmlContent.substring(0, 200) + "...");
    
    const emailData = {
      from: "info@bobediitgroup.co.za",
      to: to,
      subject: subject,
      text: message + textSignature,
      html: htmlContent
    };
    
    // Add attachments if any
    if (req.files && req.files.length > 0) {
      emailData.attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        type: file.mimetype
      }));
      
      console.log(`Sending email with ${req.files.length} attachment(s):`, req.files.map(f => f.originalname));
    }
    
    const emailResponse = await resend.emails.send(emailData);
    
    console.log("Email sent successfully:", emailResponse);
    res.json({ success: true, emailId: emailResponse.id });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email", details: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to manage emails`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});


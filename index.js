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

// inbound webhook endpoint
app.post("/inbound-email", async (req, res) => {
  console.log("Webhook received:");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const webhookData = req.body;
    
    // Handle different webhook formats from Resend
    let emailData;
    
    if (webhookData.type === "email.received" && webhookData.data) {
      // Resend webhook format
      emailData = webhookData.data;
    } else if (webhookData.from || webhookData.subject) {
      // Direct email data format
      emailData = webhookData;
    } else {
      console.log("Unknown webhook format, storing raw data");
      emailData = webhookData;
    }

    // Store email in JSON file
    const emails = await readEmails();
    const newEmail = {
      id: Date.now().toString(),
      from: emailData.from || emailData.sender || "Unknown Sender",
      to: emailData.to || emailData.recipient || "info@bobediitgroup.co.za",
      subject: emailData.subject || "No Subject",
      text: emailData.text || emailData.plain || "No content",
      html: emailData.html || emailData.html_body || null,
      timestamp: new Date().toISOString(),
      raw: emailData // Store raw data for debugging
    };
    
    emails.unshift(newEmail); // Add to beginning
    
    // Keep only last 50 emails
    if (emails.length > 50) {
      emails.splice(50);
    }
    
    await writeEmails(emails);

    console.log("Email stored successfully:", newEmail.subject);

    // Still forward to Gmail for backup
    try {
      await resend.emails.send({
        from: "info@bobediitgroup.co.za",
        to: "bobedi.it@gmail.com",
        subject: `[FWD] ${newEmail.subject}`,
        html: newEmail.html || `<pre>${newEmail.text}</pre>`
      });
      console.log("Email forwarded to Gmail");
    } catch (forwardError) {
      console.error("Error forwarding to Gmail:", forwardError);
    }

    res.status(200).json({ success: true, message: "Email received" });
  } catch (error) {
    console.error("Error processing email:", error);
    res.status(500).json({ error: "Error processing email", details: error.message });
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


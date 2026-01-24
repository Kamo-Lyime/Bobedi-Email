import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, resend-signature",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Verify webhook signature (optional but recommended)
function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers.get("resend-signature");
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    console.log("📧 Inbound email webhook received at", new Date().toISOString());

    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      console.error("❌ Webhook signature verification failed");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    console.log("Webhook payload:", JSON.stringify(body, null, 2));
    
    // Handle different webhook formats
    let emailData;
    
    if (body.type === "email.received" && body.data) {
      // Resend webhook format
      emailData = body.data;
      console.log("✅ Resend webhook format detected");
    } else if (body.from || body.subject) {
      // Direct email data format
      emailData = body;
      console.log("✅ Direct email format detected");
    } else {
      console.log("⚠️ Unknown webhook format");
      emailData = body;
    }

    // Extract email details with better handling
    const emailId = emailData.email_id || emailData.id;
    const fromAddress = emailData.from || emailData.sender || emailData.from_email || "Unknown Sender";
    const toAddress = Array.isArray(emailData.to) ? emailData.to[0] : (emailData.to || emailData.recipient || emailData.to_email || "info@bobediitgroup.co.za");
    const subject = emailData.subject || "No Subject";
    
    console.log(`Processing email from: ${fromAddress}, subject: ${subject}, email_id: ${emailId}`);
    
    // Resend webhook doesn't include email body - fetch it via Receiving API
    let textContent = "";
    let htmlContent = null;
    let attachments = [];
    
    if (emailId) {
      console.log(`📥 Fetching full email content from Resend Receiving API...`);
      try {
        // Use the RECEIVING endpoint (different from sent emails)
        const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const fullEmail = await response.json();
          console.log(`✅ Full email retrieved, has html: ${!!fullEmail.html}, has text: ${!!fullEmail.text}, attachments: ${fullEmail.attachments?.length || 0}`);
          
          textContent = fullEmail.text || "";
          htmlContent = fullEmail.html || null;
          attachments = fullEmail.attachments || [];
        } else {
          console.error(`❌ Failed to fetch email: ${response.status} ${response.statusText}`);
          const errorBody = await response.text();
          console.error(`Error details:`, errorBody);
        }
      } catch (fetchError) {
        console.error("❌ Error fetching full email:", fetchError);
      }
    }

    console.log(`Text content length: ${textContent.length}, HTML content: ${htmlContent ? 'present' : 'none'}, Attachments: ${attachments.length}`);

    // Forward to Gmail backup (with error handling)
    try {
      await resend.emails.send({
        from: "info@bobediitgroup.co.za",
        to: "bobedi.it@gmail.com",
        subject: `[Inbox] ${subject}`,
        text: `From: ${fromAddress}\nTo: ${toAddress}\n\n${textContent}`,
        html: htmlContent || `<p><strong>From:</strong> ${fromAddress}</p><p><strong>To:</strong> ${toAddress}</p><hr><pre>${textContent}</pre>`,
      });
      console.log("✅ Email forwarded to Gmail backup");
    } catch (forwardError) {
      console.error("⚠️ Error forwarding to Gmail:", forwardError);
      // Don't fail the whole request if forwarding fails
    }

    // Store in Supabase database
    try {
      const { data, error } = await supabase.from("emails").insert({
        id: crypto.randomUUID(),
        from_address: fromAddress,
        to_address: toAddress,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: attachments,
        resend_email_id: emailId,
        received_at: new Date().toISOString(),
        raw_payload: emailData,
      });

      if (error) {
        console.error("❌ Error storing email in database:", error);
        throw error;
      }

      console.log("✅ Email stored in database successfully");
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      // Continue even if database fails - email was already forwarded
    }

    return new Response(
      JSON.stringify({ 
        status: "ok", 
        message: "Email received and processed",
        timestamp: new Date().toISOString()
      }), 
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("❌ Error processing inbound email:", err);
    console.error("Stack trace:", err.stack);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: err.message,
        timestamp: new Date().toISOString()
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, PATCH, OPTIONS",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function listEmails() {
  const { data, error } = await supabase
    .from("emails")
    .select("id, from_address, to_address, subject, text, html, received_at, attachments, resend_email_id, read")
    .order("received_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  
  // Map database fields to frontend-expected fields
  const emails = (data ?? []).map(email => ({
    id: email.id,
    from: email.from_address,
    to: email.to_address,
    subject: email.subject,
    text: email.text,
    html: email.html,
    timestamp: email.received_at,
    attachments: email.attachments || [],
    resend_email_id: email.resend_email_id,
    read: email.read ?? false
  }));
  
  return emails;
}

async function sendEmail(formData: FormData) {
  const to = formData.get("to")?.toString() ?? "";
  const subject = formData.get("subject")?.toString() ?? "";
  const message = formData.get("message")?.toString() ?? "";
  const cc = formData.get("cc")?.toString() ?? "";
  const bcc = formData.get("bcc")?.toString() ?? "";
  
  if (!to || !subject || !message) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  const signature = `\n\n--\nBobedi IT Group\nwww.bobediitgroup.co.za\ninfo@bobediitgroup.co.za`;
  const htmlSignature = `\n<br><div style="border-top:2px solid #667eea;padding-top:12px;margin-top:12px;font-family:Arial,sans-serif;">\n    <table cellpadding="0" cellspacing="0" border="0">\n      <tr>\n        <td style="padding-right:12px;vertical-align:middle;">\n          <img src="https://raw.githubusercontent.com/Kamo-Lyime/Bobedi-Email/master/public/images/Bobedi%20IT%20Group.png" alt="Bobedi IT Group" style="width:50px;height:50px;border-radius:8px;" />\n        </td>\n        <td style="vertical-align:middle;">\n          <strong style="color:#333;font-size:15px;">Bobedi IT Group</strong><br>\n          <a href="https://www.bobediitgroup.co.za" style="color:#007AFF;text-decoration:none;font-size:14px;">www.bobediitgroup.co.za</a><br>\n          <a href="mailto:info@bobediitgroup.co.za" style="color:#555;text-decoration:none;font-size:13px;">info@bobediitgroup.co.za</a>\n        </td>\n      </tr>\n    </table>\n  </div>`;

  const files = formData.getAll("attachments");
  const attachments = await Promise.all(files.map(async (item) => {
    if (!(item instanceof File)) return null;
    const content = new Uint8Array(await item.arrayBuffer());
    return { filename: item.name, content, type: item.type };
  }));

  const emailPayload: Record<string, unknown> = {
    from: "info@bobediitgroup.co.za",
    to,
    subject,
    text: `${message}${signature}`,
    html: `<p>${message.replace(/\n/g, "<br>")}</p>${htmlSignature}`,
  };
  
  // Add CC and BCC if provided
  if (cc) {
    emailPayload.cc = cc;
  }
  if (bcc) {
    emailPayload.bcc = bcc;
  }

  const validAttachments = attachments.filter((a) => a !== null) as Array<Record<string, unknown>>;
  if (validAttachments.length > 0) {
    emailPayload.attachments = validAttachments;
  }

  const sent = await resend.emails.send(emailPayload as never);
  
  // Build complete recipient list for storage
  const allRecipients = [to];
  if (cc) allRecipients.push(...cc.split(',').map(e => e.trim()));
  if (bcc) allRecipients.push(...bcc.split(',').map(e => e.trim()));

  await supabase.from("emails").insert({
    id: crypto.randomUUID(),
    from_address: "info@bobediitgroup.co.za",
    to_address: allRecipients.join(', '),
    subject,
    text: emailPayload.text as string,
    html: emailPayload.html as string,
    received_at: new Date().toISOString(),
    raw_payload: sent,
  });

  return jsonResponse({ success: true, emailId: sent?.id ?? null });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    if (req.method === "GET" && url.pathname.endsWith("/emails")) {
      const data = await listEmails();
      return jsonResponse({ emails: data });
    }

    if (req.method === "POST" && (url.pathname.endsWith("/compose") || url.pathname.endsWith("/reply"))) {
      const formData = await req.formData();
      return await sendEmail(formData);
    }
    
    // Download attachment endpoint: /attachments/{emailId}/{attachmentId}
    if (req.method === "GET" && url.pathname.includes("/attachments/")) {
      const pathParts = url.pathname.split('/');
      const emailId = pathParts[pathParts.length - 2];
      const attachmentId = pathParts[pathParts.length - 1];
      
      try {
        // Get the resend_email_id from database
        const { data: emailData, error: emailError } = await supabase
          .from("emails")
          .select("resend_email_id")
          .eq("id", emailId)
          .single();
        
        if (emailError || !emailData?.resend_email_id) {
          console.error("Email not found or missing resend_email_id");
          return jsonResponse({ error: "Email not found" }, 404);
        }
        
        // Get attachment metadata with signed download URL from Resend
        const response = await fetch(`https://api.resend.com/emails/receiving/${emailData.resend_email_id}/attachments/${attachmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          },
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch attachment: ${response.status}`);
          const errorText = await response.text();
          console.error(`Error details: ${errorText}`);
          return jsonResponse({ error: "Attachment not found" }, 404);
        }
        
        const attachmentData = await response.json();
        
        // Return the signed download URL to the frontend
        return jsonResponse({ 
          download_url: attachmentData.download_url,
          filename: attachmentData.filename,
          content_type: attachmentData.content_type,
          size: attachmentData.size
        });
      } catch (error) {
        console.error("Error fetching attachment:", error);
        return jsonResponse({ error: "Failed to fetch attachment" }, 500);
      }
    }
    
    if (req.method === "DELETE" && url.pathname.includes("/emails/")) {
      const emailId = url.pathname.split('/').pop();
      
      const { error } = await supabase
        .from("emails")
        .delete()
        .eq("id", emailId);
      
      if (error) {
        console.error("Delete error:", error);
        return jsonResponse({ error: "Failed to delete email" }, 500);
      }
      
      return jsonResponse({ success: true, message: "Email deleted" });
    }
    
    // Mark email as read endpoint: PATCH /emails/{emailId}/read
    if (req.method === "PATCH" && url.pathname.includes("/emails/") && url.pathname.endsWith("/read")) {
      const emailId = url.pathname.split('/')[url.pathname.split('/').length - 2];
      
      const { error } = await supabase
        .from("emails")
        .update({ read: true })
        .eq("id", emailId);
      
      if (error) {
        console.error("Mark as read error:", error);
        return jsonResponse({ error: "Failed to mark email as read" }, 500);
      }
      
      return jsonResponse({ success: true, message: "Email marked as read" });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("email-api error", error);
    return jsonResponse({ error: "Server error", details: (error as Error).message }, 500);
  }
});

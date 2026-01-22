import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
    .select("id, from_address, to_address, subject, text, html, received_at")
    .order("received_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

async function sendEmail(formData: FormData) {
  const to = formData.get("to")?.toString() ?? "";
  const subject = formData.get("subject")?.toString() ?? "";
  const message = formData.get("message")?.toString() ?? "";
  if (!to || !subject || !message) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  const signature = `\n\n--\nBobedi IT Group\nwww.bobediitgroup.co.za\ninfo@bobediitgroup.co.za`;
  const htmlSignature = `\n<br><div style="border-top:2px solid #667eea;padding-top:12px;margin-top:12px;font-family:Arial,sans-serif;">\n    <strong>Bobedi IT Group</strong><br>\n    <a href="https://www.bobediitgroup.co.za" style="color:#007AFF;text-decoration:none;">www.bobediitgroup.co.za</a><br>\n    <a href="mailto:info@bobediitgroup.co.za" style="color:#555;text-decoration:none;">info@bobediitgroup.co.za</a>\n  </div>`;

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

  const validAttachments = attachments.filter((a) => a !== null) as Array<Record<string, unknown>>;
  if (validAttachments.length > 0) {
    emailPayload.attachments = validAttachments;
  }

  const sent = await resend.emails.send(emailPayload as never);

  await supabase.from("emails").insert({
    id: crypto.randomUUID(),
    from_address: "info@bobediitgroup.co.za",
    to_address: to,
    subject,
    text: message,
    html: emailPayload.html,
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

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("email-api error", error);
    return jsonResponse({ error: "Server error", details: (error as Error).message }, 500);
  }
});

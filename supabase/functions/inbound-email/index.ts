import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    if (type === "email.received") {
      await resend.emails.send({
        from: "info@bobediitgroup.co.za",
        to: "bobedi.it@gmail.com",
        subject: data.subject,
        text: data.text,
        html: data.html || `<p>${data.text}</p>`,
      });

      if (supabase) {
        await supabase.from("emails").insert({
          id: crypto.randomUUID(),
          from_address: data.from,
          to_address: data.to,
          subject: data.subject,
          text: data.text,
          html: data.html,
          received_at: new Date().toISOString(),
          raw_payload: data,
        });
      }

      console.log("Email received and forwarded!", data);
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error forwarding email:", err);
    return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers: corsHeaders });
  }
});

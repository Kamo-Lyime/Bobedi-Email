import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Resend from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const { type, data } = await req.json();

    if (type === "email.received") {
      // Forward email to Gmail
      await resend.emails.send({
        from: "info@bobediitgroup.co.za",  // MUST be verified on Resend
        to: "bobedi.it@gmail.com",
        subject: data.subject,
        text: data.text,
        html: data.html || `<p>${data.text}</p>`,
      });

      console.log("Email received and forwarded!", data);
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (err) {
    console.error("Error forwarding email:", err);
    return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500 });
  }
});

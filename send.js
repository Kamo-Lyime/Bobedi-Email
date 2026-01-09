// send.js
import { Resend } from "resend";

// Replace with your actual Resend API key
const resend = new Resend({ apiKey: "re_RKzDEmiB_7s5TC9eFTPSfv8S85rjaPtDU" });

// Change the recipient to the email you want to send to
const recipientEmail = "Kamohelo.Mokoteli@yahoo.com";

async function sendEmail() {
  try {
    const response = await resend.emails.send({
      from: "info@bobediitgroup.co.za", // your verified sender
      to: recipientEmail,
      subject: "Test Email from Bobedi IT Group",
      text: "Hello! This is a test email sent via Resend.",
      html: "<p>Hello! This is a test email sent via <strong>Resend</strong>.</p>",
    });

    console.log("Email sent successfully:", response);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

// Run the function
sendEmail();

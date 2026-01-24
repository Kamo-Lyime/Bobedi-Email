// Test script to simulate an inbound email webhook
// Usage: node test-webhook.js [webhook-url]

const webhookUrl = process.argv[2] || "http://localhost:3000/inbound-email";

const testEmail = {
  type: "email.received",
  data: {
    from: "test@example.com",
    to: "info@bobediitgroup.co.za",
    subject: "Test Inbound Email",
    text: "This is a test email to verify inbound email functionality.",
    html: "<p>This is a <strong>test email</strong> to verify inbound email functionality.</p>",
    timestamp: new Date().toISOString(),
    message_id: "test-" + Date.now(),
  }
};

console.log("🧪 Testing webhook endpoint:", webhookUrl);
console.log("📧 Sending test email data...\n");

fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(testEmail),
})
  .then(async (response) => {
    console.log("📊 Response Status:", response.status, response.statusText);
    const text = await response.text();
    
    try {
      const json = JSON.parse(text);
      console.log("📦 Response Body:", JSON.stringify(json, null, 2));
    } catch {
      console.log("📦 Response Body (text):", text);
    }

    if (response.ok) {
      console.log("\n✅ Test successful! Check your emails.json file or database.");
      console.log("✅ You should also receive a forwarded email at bobedi.it@gmail.com");
    } else {
      console.log("\n❌ Test failed. Check the error message above.");
    }
  })
  .catch((error) => {
    console.error("❌ Error sending test request:", error.message);
    console.error("\nMake sure:");
    console.error("1. Your server is running (npm start)");
    console.error("2. The webhook URL is correct");
    console.error("3. You have internet connection");
  });

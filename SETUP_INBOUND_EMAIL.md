# Setting Up Inbound Email for bobediitgroup.co.za

## Overview
To receive emails at your domain (info@bobediitgroup.co.za), you need to:
1. Configure DNS records for email receiving
2. Set up a publicly accessible webhook endpoint
3. Configure the webhook in Resend dashboard

---

## Step 1: Configure DNS Records for Inbound Email

### Option A: Using Resend for Inbound Email (Recommended)

Add these MX records to your DNS settings (where you manage bobediitgroup.co.za):

```
Type: MX
Name: @ (or leave blank for root domain)
Priority: 10
Value: feedback-smtp.us-east-1.amazonses.com
```

**Alternative Resend MX Records** (check Resend documentation for current values):
```
Type: MX
Name: @
Priority: 10
Value: mx.resend.com
```

### Verification
After adding MX records:
1. Wait 5-10 minutes for DNS propagation
2. Verify using: https://mxtoolbox.com/
3. Enter: bobediitgroup.co.za
4. Confirm MX records appear correctly

---

## Step 2: Make Webhook Endpoint Publicly Accessible

You have 3 deployment options:

### Option A: Deploy to Vercel (Easiest for Express app)

1. **Update vercel.json** (already exists in your project):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

2. **Deploy to Vercel**:
```bash
npm install -g vercel
vercel login
vercel
```

3. **Add Environment Variables in Vercel Dashboard**:
   - `RESEND_API_KEY=your_resend_api_key`

4. **Your webhook URL will be**: `https://your-project.vercel.app/inbound-email`

### Option B: Use Supabase Edge Function (Recommended for Supabase users)

Your Supabase function is already created at `supabase/functions/inbound-email/index.ts`

1. **Deploy the function**:
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set environment variables
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Deploy the function
supabase functions deploy inbound-email
```

2. **Your webhook URL will be**: 
   `https://your-project-ref.supabase.co/functions/v1/inbound-email`

### Option C: Use ngrok for Testing (Development Only)

1. **Install ngrok**: https://ngrok.com/download

2. **Start your local server**:
```bash
npm start
```

3. **In a new terminal, start ngrok**:
```bash
ngrok http 3000
```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Your webhook URL will be**: `https://abc123.ngrok.io/inbound-email`

---

## Step 3: Configure Webhook in Resend Dashboard

1. Go to: https://resend.com/webhooks
2. Click "Add Webhook"
3. Configure:
   - **URL**: Your public webhook endpoint from Step 2
   - **Events to subscribe to**: Select "Email Received" (`email.received`)
   - **Secret**: (optional but recommended for security)

4. Click "Create Webhook"
5. Test the webhook using the "Send Test" button

---

## Step 4: Configure Inbound Email Route in Resend

1. Go to: https://resend.com/inbound
2. Add your domain: `bobediitgroup.co.za`
3. Add a route:
   - **Match**: `info@bobediitgroup.co.za` (or `*@bobediitgroup.co.za` for all emails)
   - **Forward to**: Select "Webhook"
   - **Webhook URL**: Your public webhook endpoint from Step 2

---

## Step 5: Test Inbound Email

1. **Send a test email** to `info@bobediitgroup.co.za` from any email account

2. **Check logs**:
   - For Vercel: Check Vercel dashboard logs
   - For Supabase: `supabase functions logs inbound-email`
   - For ngrok/local: Check your terminal console

3. **Verify email was received**:
   - Check `emails.json` file (for Express app)
   - Check Supabase `emails` table (for Supabase function)
   - Check if email was forwarded to `bobedi.it@gmail.com`

---

## Troubleshooting

### MX Records Not Working
- **Wait**: DNS changes can take 24-48 hours
- **Verify**: Use MX Toolbox (https://mxtoolbox.com/)
- **Check TTL**: Lower TTL values propagate faster

### Webhook Not Receiving Data
- **Check URL**: Must be HTTPS (not HTTP)
- **Check logs**: Look for error messages
- **Verify webhook is active** in Resend dashboard
- **Test with curl**:
```bash
curl -X POST https://your-webhook-url/inbound-email \
  -H "Content-Type: application/json" \
  -d '{"type":"email.received","data":{"from":"test@example.com","to":"info@bobediitgroup.co.za","subject":"Test","text":"Test message"}}'
```

### Emails Not Appearing in Interface
- **Check file permissions** for `emails.json`
- **Check database connection** if using Supabase
- **Verify email was stored**: Look at webhook logs

### CORS Errors
- Webhook endpoints don't need CORS (server-to-server)
- If you see CORS errors, it's from your web interface (different issue)

---

## Current Setup Status

✅ Express server with `/inbound-email` webhook endpoint  
✅ Supabase Edge Function for inbound email  
✅ Email forwarding to Gmail backup  
✅ Email storage in JSON file  
❌ **MX records not configured**  
❌ **Webhook not publicly accessible**  
❌ **Resend webhook not configured**  

---

## Recommended Next Steps

1. **Choose deployment method**: 
   - Supabase (if you're using Supabase for database)
   - Vercel (if you want simple Express deployment)

2. **Deploy webhook endpoint** to make it publicly accessible

3. **Configure DNS MX records** with your domain registrar

4. **Set up webhook** in Resend dashboard

5. **Test** by sending an email to info@bobediitgroup.co.za

---

## Security Considerations

1. **Webhook Secret**: Add secret verification to your webhook endpoint
2. **Rate Limiting**: Implement to prevent abuse
3. **Input Validation**: Validate email data before storing
4. **HTTPS Only**: Never use HTTP for webhooks

---

## Support

- Resend Documentation: https://resend.com/docs/dashboard/webhooks/introduction
- Resend Inbound Email: https://resend.com/docs/send-with-resend/inbound-emails
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

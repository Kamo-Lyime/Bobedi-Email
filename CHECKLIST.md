# Email Receiving Setup Checklist

## ✅ Quick Status Check

- [ ] **DNS MX Records** - Configured for bobediitgroup.co.za
- [ ] **Webhook Deployed** - Publicly accessible endpoint
- [ ] **Resend Webhook** - Configured in dashboard
- [ ] **Resend Inbound Route** - Email routing configured
- [ ] **Testing** - Successfully received test email

---

## 📋 Detailed Setup Steps

### 1️⃣ Choose Your Deployment Method

Pick ONE of these options:

#### Option A: Vercel (Recommended for Express.js)
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Deploy: `vercel --prod`
- [ ] Set environment variables in Vercel dashboard
- [ ] Note your URL: `https://your-project.vercel.app`
- [ ] **See**: [deploy-vercel.md](deploy-vercel.md)

#### Option B: Supabase Edge Functions
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Run deployment script: `.\deploy-supabase.ps1` (Windows) or `./deploy-supabase.sh` (Linux/Mac)
- [ ] Note your URL: `https://your-ref.supabase.co/functions/v1/inbound-email`
- [ ] **See**: [SETUP_INBOUND_EMAIL.md](SETUP_INBOUND_EMAIL.md)

#### Option C: Other Hosting (Railway, Render, etc.)
- [ ] Deploy your Express app to your chosen platform
- [ ] Ensure `/inbound-email` endpoint is accessible
- [ ] Configure environment variables
- [ ] Note your webhook URL

---

### 2️⃣ Configure DNS Records

Go to your domain registrar (where you manage bobediitgroup.co.za):

**If using Resend for inbound email:**
- [ ] Add MX record:
  - Type: `MX`
  - Name: `@` (or leave blank)
  - Priority: `10`
  - Value: Check Resend docs for current MX server

**Verify DNS:**
- [ ] Wait 5-10 minutes for propagation
- [ ] Check at https://mxtoolbox.com/
- [ ] Search for: `bobediitgroup.co.za`
- [ ] Confirm MX records appear

---

### 3️⃣ Configure Resend Dashboard

#### A. Add Webhook
Go to: https://resend.com/webhooks

- [ ] Click "Add Webhook"
- [ ] Enter webhook URL: `https://your-deployment-url/inbound-email`
- [ ] Select events: Check "Email Received" (`email.received`)
- [ ] (Optional) Add webhook secret for security
- [ ] Save webhook
- [ ] Click "Send Test" to verify

#### B. Configure Inbound Email
Go to: https://resend.com/inbound

- [ ] Add domain: `bobediitgroup.co.za`
- [ ] Verify domain ownership (follow Resend instructions)
- [ ] Add email route:
  - **Match**: `info@bobediitgroup.co.za` (or `*@bobediitgroup.co.za` for all)
  - **Forward to**: Webhook
  - **Webhook URL**: `https://your-deployment-url/inbound-email`
- [ ] Save route

---

### 4️⃣ Environment Variables

Ensure these are set in your deployment platform:

- [ ] `RESEND_API_KEY` - Your Resend API key
- [ ] `RESEND_WEBHOOK_SECRET` - (Optional) Webhook signature secret
- [ ] `SUPABASE_URL` - (If using Supabase) Your project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - (If using Supabase) Service role key
- [ ] `NODE_ENV` - Set to `production`

---

### 5️⃣ Test the Setup

#### Local Testing (Optional)
- [ ] Start local server: `npm start`
- [ ] Run test script: `node test-webhook.js`
- [ ] Check console for success message
- [ ] Verify email appears in `emails.json`

#### Production Testing
- [ ] Send email to `info@bobediitgroup.co.za` from any email account
- [ ] Wait 1-2 minutes
- [ ] Check deployment logs:
  - Vercel: `vercel logs`
  - Supabase: `supabase functions logs inbound-email`
- [ ] Verify email appears in your system
- [ ] Check `bobedi.it@gmail.com` for forwarded copy

---

## 🔍 Troubleshooting

### Email Not Received

**Check DNS:**
- [ ] Verify MX records at https://mxtoolbox.com/
- [ ] Wait longer (DNS can take up to 48 hours)
- [ ] Check for DNS errors or warnings

**Check Webhook:**
- [ ] Verify URL is HTTPS (not HTTP)
- [ ] Test webhook manually:
  ```bash
  node test-webhook.js https://your-deployment-url/inbound-email
  ```
- [ ] Check webhook is active in Resend dashboard
- [ ] Look for webhook delivery errors in Resend

**Check Logs:**
- [ ] View deployment logs for errors
- [ ] Check for timeout errors (increase function timeout if needed)
- [ ] Verify all environment variables are set

### Emails Go to Spam
- [ ] Add SPF record to DNS
- [ ] Add DKIM records (from Resend)
- [ ] Verify domain in Resend

### Webhook Returns 401/403
- [ ] Check webhook signature verification
- [ ] Verify `RESEND_WEBHOOK_SECRET` matches
- [ ] Temporarily disable signature check for testing

### Database Errors
- [ ] Verify Supabase connection
- [ ] Check `emails` table exists
- [ ] Review database migration was run
- [ ] Check service role key has correct permissions

---

## 📊 Monitoring

**Regular Checks:**
- [ ] Monitor webhook delivery in Resend dashboard
- [ ] Check application logs regularly
- [ ] Verify emails are being stored correctly
- [ ] Monitor Gmail forwarding is working

**Set Up Alerts:**
- [ ] Configure error notifications in your deployment platform
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Monitor disk space for `emails.json` growth

---

## 🔒 Security Recommendations

- [ ] Enable webhook signature verification
- [ ] Add rate limiting to webhook endpoint
- [ ] Regularly rotate API keys
- [ ] Monitor for unusual activity
- [ ] Keep dependencies updated
- [ ] Use environment variables (never hardcode secrets)

---

## 📚 Resources

- **Resend Docs**: https://resend.com/docs
- **Resend Webhooks**: https://resend.com/docs/dashboard/webhooks/introduction
- **Resend Inbound**: https://resend.com/docs/send-with-resend/inbound-emails
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Functions**: https://supabase.com/docs/guides/functions

---

## 🆘 Getting Help

If you're stuck:

1. **Check logs** first - most issues show up in logs
2. **Test webhook manually** using test-webhook.js
3. **Verify DNS** using online tools
4. **Review Resend dashboard** for delivery failures
5. **Check environment variables** are all set correctly

---

## ✨ Success Criteria

You know it's working when:
- ✅ Email sent to info@bobediitgroup.co.za arrives in your system
- ✅ Email appears in your web interface (localhost:3000)
- ✅ Email is forwarded to bobedi.it@gmail.com
- ✅ Webhook logs show successful processing
- ✅ No errors in deployment logs

**Once everything works:**
- Send a test email from different providers (Gmail, Outlook, etc.)
- Test reply functionality
- Verify attachments work (if applicable)
- Document your setup for future reference

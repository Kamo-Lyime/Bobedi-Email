# Quick Start Guide - Get Your Email Receiving Working

## 🎯 Goal
Get your email system receiving emails at **info@bobediitgroup.co.za**

## 🚀 Fastest Path to Success

### Step 1: Test Locally First (5 minutes)

1. **Start your server:**
   ```bash
   npm start
   ```

2. **In a new terminal, test the webhook:**
   ```bash
   node test-webhook.js
   ```

3. **Check if it worked:**
   - Look for "✅ Test successful!" message
   - Open http://localhost:3000 
   - Check if test email appears
   - Check `emails.json` file for the test data

**✅ If local test works, continue to Step 2**  
**❌ If it doesn't work, fix local issues first before deploying**

---

### Step 2: Make It Public (10 minutes)

Choose ONE deployment method:

#### Option A: Quick Test with ngrok (Fastest)
```bash
# Install ngrok from https://ngrok.com/download
ngrok http 3000
```
- Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
- Your webhook URL: `https://abc123.ngrok.io/inbound-email`
- ⚠️ **Temporary only** - URL changes each time

#### Option B: Deploy to Vercel (Production)
```bash
npm install -g vercel
vercel login
vercel --prod
```
- Note your production URL
- Add environment variable `RESEND_API_KEY` in Vercel dashboard
- Your webhook URL: `https://your-project.vercel.app/inbound-email`

#### Option C: Deploy to Supabase (If using Supabase)
```bash
npm install -g supabase
.\deploy-supabase.ps1
```
- Follow the prompts
- Your webhook URL: `https://your-ref.supabase.co/functions/v1/inbound-email`

---

### Step 3: Configure Resend (5 minutes)

#### A. Set up Webhook
1. Go to https://resend.com/webhooks
2. Click "Add Webhook"
3. Enter your webhook URL from Step 2
4. Select event: "Email Received"
5. Click "Create"
6. Click "Send Test" to verify

#### B. Set up Inbound Email Route
1. Go to https://resend.com/inbound
2. Add domain: `bobediitgroup.co.za`
3. Click "Add Route"
4. Configure:
   - Match: `info@bobediitgroup.co.za`
   - Forward to: Webhook
   - Webhook URL: Your URL from Step 2
5. Save

---

### Step 4: Configure DNS (1 hour wait time)

1. **Go to your domain registrar** (where you bought bobediitgroup.co.za)

2. **Find DNS settings** (might be called "DNS Management" or "Name Servers")

3. **Add MX record:**
   ```
   Type: MX
   Name: @ (or leave blank for root domain)
   Priority: 10
   Value: [Check Resend dashboard for current MX server]
   ```

4. **Wait 5-60 minutes** for DNS to propagate

5. **Verify at**: https://mxtoolbox.com/ → Search for `bobediitgroup.co.za`

---

### Step 5: Test End-to-End (2 minutes)

1. **Send a test email** to `info@bobediitgroup.co.za` from Gmail/Outlook/any email

2. **Check these places:**
   - Your deployment logs (webhook should be called)
   - `bobedi.it@gmail.com` (should receive forwarded copy)
   - Your web interface at localhost:3000 or your deployment URL
   - `emails.json` file (should contain the email)

3. **If it worked:** 🎉 **Success!** You're receiving emails!

4. **If it didn't work:** See troubleshooting below ⬇️

---

## 🔧 Quick Troubleshooting

### Problem: Local test fails
**Solution:**
- Check if server is running on port 3000
- Verify `RESEND_API_KEY` in `.env` file
- Check console for error messages
- Make sure `emails.json` exists and is writable

### Problem: Webhook returns 404
**Solution:**
- Verify URL ends with `/inbound-email`
- Check your deployment is actually running
- Test the URL in your browser (should see error or response)

### Problem: Email not received after 10 minutes
**Solution:**
1. Check MX records are correct: https://mxtoolbox.com/
2. Look at webhook delivery in Resend dashboard
3. Check webhook logs for errors
4. Verify webhook is active in Resend

### Problem: Webhook signature verification fails
**Solution:**
- Comment out signature verification temporarily
- Set `RESEND_WEBHOOK_SECRET` if you configured one
- Check webhook logs for the exact error

---

## 📋 What You Need

Before starting, make sure you have:

- [x] Node.js installed (v18+)
- [x] Resend account and API key
- [x] Access to bobediitgroup.co.za DNS settings
- [x] This project running locally

---

## 🎓 Understanding the Flow

```
1. Someone sends email to info@bobediitgroup.co.za
                ↓
2. Email arrives at Resend (via MX records)
                ↓
3. Resend routes email based on inbound rules
                ↓
4. Resend sends webhook to your endpoint
                ↓
5. Your server receives and stores the email
                ↓
6. Email forwarded to bobedi.it@gmail.com
                ↓
7. Email appears in your web interface
```

---

## 📞 Current Status

Your system has:
- ✅ Webhook endpoint ready (`/inbound-email`)
- ✅ Email storage (JSON file + optional Supabase)
- ✅ Forwarding to Gmail
- ✅ Web interface to view emails
- ❌ **Not deployed publicly yet** ← You need to do this
- ❌ **MX records not configured** ← You need to do this
- ❌ **Resend webhook not configured** ← You need to do this

---

## ⏱️ Time Estimate

- **Local testing**: 5 minutes
- **Deployment**: 10 minutes
- **Resend setup**: 5 minutes
- **DNS configuration**: 5 minutes setup + 30-60 minutes wait
- **End-to-end testing**: 2 minutes

**Total**: ~1 hour (mostly waiting for DNS)

---

## 🎯 Next Steps

Start with Step 1 above! 👆

Test locally first, then work your way through the steps. Don't skip the local test - it will save you debugging time later.

**Questions?** Check the detailed guides:
- [SETUP_INBOUND_EMAIL.md](SETUP_INBOUND_EMAIL.md) - Complete setup guide
- [CHECKLIST.md](CHECKLIST.md) - Detailed checklist
- [deploy-vercel.md](deploy-vercel.md) - Vercel deployment

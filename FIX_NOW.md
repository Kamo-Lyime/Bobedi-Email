# 🚨 FIX EMAIL RECEIVING - DO THIS NOW

## Your Problem
**Emails sent to info@bobediitgroup.co.za are NOT being received.**

## Why?
Your webhook endpoint is only running on your local computer (localhost:3000). The internet cannot reach it.

## The Fix (Choose One Path)

---

## 🚀 PATH A: Quick Test with ngrok (5 minutes)

**Use this to test if everything works before permanent deployment**

### Steps:
1. Download ngrok: https://ngrok.com/download
2. Start your server: `npm start`
3. In new terminal: `ngrok http 3000`
4. Copy the HTTPS URL (like `https://abc123.ngrok.io`)
5. Go to https://resend.com/webhooks
6. Add webhook: `https://abc123.ngrok.io/inbound-email`
7. Select event: "Email Received"
8. Go to https://resend.com/inbound
9. Add route: `info@bobediitgroup.co.za` → Webhook → Same URL as above
10. Send test email to info@bobediitgroup.co.za

**✅ If email appears, everything works! Now deploy permanently.**  
**❌ If not, check ngrok terminal for errors.**

---

## 🌐 PATH B: Deploy to Vercel (10 minutes)

**Permanent solution - Recommended**

### Steps:
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### After deployment:
1. Note your URL (e.g., `https://bobedi-email.vercel.app`)
2. Go to Vercel dashboard → Your project → Settings → Environment Variables
3. Add: `RESEND_API_KEY` = your Resend API key
4. Redeploy: `vercel --prod`
5. Go to https://resend.com/webhooks
6. Add webhook: `https://bobedi-email.vercel.app/inbound-email`
7. Select event: "Email Received"
8. Go to https://resend.com/inbound
9. Add route: `info@bobediitgroup.co.za` → Webhook → Same URL
10. Send test email to info@bobediitgroup.co.za

---

## ☁️ PATH C: Deploy to Supabase (15 minutes)

**If you're using Supabase database**

### Steps:
```powershell
# Run the deployment script
.\deploy-supabase.ps1
```

Follow the prompts, then:
1. Note your function URL (e.g., `https://xxx.supabase.co/functions/v1/inbound-email`)
2. Go to https://resend.com/webhooks
3. Add webhook: Your function URL
4. Select event: "Email Received"
5. Go to https://resend.com/inbound
6. Add route: `info@bobediitgroup.co.za` → Webhook → Same URL
7. Send test email to info@bobediitgroup.co.za

---

## 📧 Configure DNS (Required for ALL paths)

**This makes bobediitgroup.co.za able to receive emails**

### Steps:
1. Go to where you manage bobediitgroup.co.za DNS (domain registrar)
2. Find DNS settings
3. Add MX record:
   - **Type**: MX
   - **Name**: @ (or leave blank)
   - **Priority**: 10
   - **Value**: Check Resend dashboard for current MX server
4. Save
5. Wait 10-60 minutes
6. Verify at https://mxtoolbox.com/ (search: bobediitgroup.co.za)

---

## ✅ Verify It's Working

Send email to info@bobediitgroup.co.za from your Gmail/Outlook.

**Check these:**
1. ✅ Email appears at http://localhost:3000 (or your deployed URL)
2. ✅ Email forwarded to bobedi.it@gmail.com
3. ✅ No errors in logs

---

## 📊 Quick Reference

| Task | Tool/Place | Time |
|------|-----------|------|
| Deploy webhook | Vercel/Supabase/ngrok | 5-15 min |
| Configure Resend webhook | https://resend.com/webhooks | 2 min |
| Configure inbound route | https://resend.com/inbound | 2 min |
| Configure DNS MX | Your domain registrar | 5 min + wait |
| Test | Send email | 1 min |

---

## 🆘 Troubleshooting

### ngrok: "Connection refused"
- Make sure `npm start` is running
- Check port is 3000

### Vercel: "Environment variable not found"
- Go to Vercel dashboard → Settings → Environment Variables
- Add `RESEND_API_KEY`
- Redeploy

### "Email not received"
- Check webhook delivery in Resend dashboard
- Check logs (Vercel: `vercel logs`, local: check terminal)
- Verify MX records: https://mxtoolbox.com/

### "404 Not Found"
- Verify URL ends with `/inbound-email`
- Check deployment is running
- Test URL in browser

---

## 📞 Get Help

If stuck, check:
1. [QUICK_START.md](QUICK_START.md) - Detailed walkthrough
2. [CHECKLIST.md](CHECKLIST.md) - Complete checklist
3. [ARCHITECTURE.md](ARCHITECTURE.md) - How it all works

---

## ⏱️ Time Estimate

- **Testing with ngrok**: 5 minutes
- **Deploy to Vercel**: 10 minutes
- **Deploy to Supabase**: 15 minutes
- **Configure Resend**: 5 minutes
- **Configure DNS**: 5 minutes + 10-60 min wait
- **Test**: 2 minutes

**Total**: 20-30 minutes active work + DNS wait time

---

## 🎯 Do This Right Now

1. **Pick a path** (ngrok for testing, Vercel for permanent)
2. **Follow the steps** above
3. **Configure Resend** webhook and inbound route
4. **Configure DNS** MX records
5. **Test** by sending email
6. **Celebrate** when it works! 🎉

**Start with PATH A (ngrok) to test everything works, then move to PATH B (Vercel) for permanent setup.**

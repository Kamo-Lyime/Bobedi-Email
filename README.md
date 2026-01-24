# Bobedi IT Group - Email Management System

Professional email management system for **info@bobediitgroup.co.za** with inbound email receiving, email composition, and forwarding capabilities.

## 🚨 **Your Issue: Not Receiving Emails**

Your email system is **NOT currently receiving inbound emails** because:

1. ❌ **Webhook not publicly accessible** - The `/inbound-email` endpoint is only on your local machine
2. ❌ **DNS MX records not configured** - bobediitgroup.co.za cannot receive emails yet
3. ❌ **Resend webhook not set up** - Webhook not configured in Resend dashboard

## ✅ **Solution: Follow the Quick Start**

👉 **Start here**: [QUICK_START.md](QUICK_START.md) - Get receiving emails in ~1 hour

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Fastest way to get email receiving working (START HERE!)
- **[CHECKLIST.md](CHECKLIST.md)** - Complete setup checklist with all steps
- **[SETUP_INBOUND_EMAIL.md](SETUP_INBOUND_EMAIL.md)** - Detailed technical setup guide
- **[deploy-vercel.md](deploy-vercel.md)** - Deploy to Vercel (recommended)
- **[deploy-supabase.ps1](deploy-supabase.ps1)** - Deploy to Supabase Edge Functions

## 🎯 Features

### Current Features (Working)
- ✅ Send emails from info@bobediitgroup.co.za
- ✅ Email composition with attachments
- ✅ Professional email signature
- ✅ Reply to emails
- ✅ Web interface for email management
- ✅ Local storage in JSON file
- ✅ Supabase database integration (optional)

### Features Not Working (Need Setup)
- ❌ **Receive emails at info@bobediitgroup.co.za** ← YOUR ISSUE
- ❌ **Receive replies to sent emails** ← YOUR ISSUE
- ❌ **Webhook endpoint publicly accessible** ← Need to deploy

## 🚀 Quick Setup

### Prerequisites
```bash
# Check Node.js version (needs 18+)
node --version

# Install dependencies
npm install
```

### Environment Setup
Create a `.env` file:
```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_WEBHOOK_SECRET=your_webhook_secret_here
PORT=3000
```

### Run Locally
```bash
# Start the server
npm start

# Test the webhook (in another terminal)
npm run test-webhook-local
```

Visit: http://localhost:3000

## 📋 To Receive Emails - Do These 3 Things

### 1. Deploy Your Webhook Endpoint

**Option A: Vercel (Easiest)**
```bash
npm install -g vercel
vercel --prod
```

**Option B: Supabase**
```bash
npm install -g supabase
.\deploy-supabase.ps1
```

**Option C: Test with ngrok**
```bash
ngrok http 3000
```

### 2. Configure Resend

1. **Webhook**: https://resend.com/webhooks
   - URL: Your deployment URL + `/inbound-email`
   - Event: "Email Received"

2. **Inbound Route**: https://resend.com/inbound
   - Domain: `bobediitgroup.co.za`
   - Route: `info@bobediitgroup.co.za` → Webhook
   - Webhook URL: Same as above

### 3. Configure DNS

Add MX record to bobediitgroup.co.za:
```
Type: MX
Name: @
Priority: 10
Value: [From Resend dashboard]
```

**Verify**: https://mxtoolbox.com/

## 🧪 Testing

### Test Webhook Locally
```bash
npm run test-webhook-local
```

### Test Deployed Webhook
```bash
npm run test-webhook
# Or specify URL:
node test-webhook.js https://your-deployment.vercel.app/inbound-email
```

### Test End-to-End
Send an email to `info@bobediitgroup.co.za` from any email account.

## 📊 Project Structure

```
bobedi-email/
├── index.js                 # Main Express server (webhook endpoint)
├── send.js                  # Test email sending script
├── test-webhook.js          # Test webhook endpoint
├── emails.json              # Local email storage
├── package.json             # Dependencies & scripts
├── vercel.json              # Vercel deployment config
├── public/                  # Web interface
│   ├── index.html          # Email management UI
│   └── images/             # Logo and assets
├── supabase/               # Supabase configuration
│   ├── functions/
│   │   ├── inbound-email/  # Edge function for receiving emails
│   │   └── email-api/      # Edge function for sending emails
│   └── migrations/         # Database schema
└── docs/                   # Documentation (this README)
    ├── QUICK_START.md      # Quick start guide
    ├── CHECKLIST.md        # Setup checklist
    └── SETUP_INBOUND_EMAIL.md  # Detailed setup
```

## 🔌 API Endpoints

### Express Server (index.js)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Web interface |
| `/inbound-email` | POST | **Webhook for receiving emails** |
| `/api/emails` | GET | List received emails |
| `/api/compose` | POST | Send new email |
| `/api/reply` | POST | Reply to email |

### Supabase Edge Functions

| Function | Purpose |
|----------|---------|
| `inbound-email` | Receive and process incoming emails |
| `email-api` | Send emails and list sent emails |

## 🛠️ Troubleshooting

### Emails Not Received
1. **Check webhook is public**: Test URL in browser
2. **Verify DNS**: Use https://mxtoolbox.com/
3. **Check Resend dashboard**: Look for webhook delivery failures
4. **View logs**: 
   - Vercel: `npm run logs-vercel`
   - Supabase: `npm run logs-supabase`

### Webhook Returns 404
- Verify endpoint is `/inbound-email` (with leading slash)
- Check deployment is running
- Test the URL manually

### Webhook Signature Fails
- Set `RESEND_WEBHOOK_SECRET` environment variable
- Or temporarily disable verification for testing

## 📦 Deployment Options

### Vercel (Recommended)
- ✅ Easy deployment
- ✅ Free tier available
- ✅ Auto-scaling
- ✅ Built-in logging

### Supabase Edge Functions
- ✅ Integrated with Supabase database
- ✅ Deno runtime
- ✅ Global edge network
- ✅ Built-in authentication

### Other Options
- Railway
- Render
- Fly.io
- AWS Lambda

## 🔒 Security

### Current Implementation
- CORS headers configured
- Environment variables for secrets
- Input validation on email sending
- Webhook signature support (optional)

### Recommended Additions
- [ ] Enable webhook signature verification
- [ ] Add rate limiting
- [ ] Implement authentication for web interface
- [ ] Add CSP headers
- [ ] Sanitize email content

## 📈 Monitoring

### View Logs
```bash
# Vercel
npm run logs-vercel

# Supabase
npm run logs-supabase

# Local
# Check terminal output when running npm start
```

### Key Metrics to Monitor
- Webhook delivery success rate
- Email forwarding success
- Storage size (emails.json)
- Response times
- Error rates

## 🤝 Support

Need help? Check these resources:

1. **[QUICK_START.md](QUICK_START.md)** - Step-by-step setup
2. **[CHECKLIST.md](CHECKLIST.md)** - Verify all steps completed
3. **Resend Docs**: https://resend.com/docs
4. **Supabase Docs**: https://supabase.com/docs

## 📝 License

ISC

## 👥 Author

Bobedi IT Group
- Website: https://www.bobediitgroup.co.za
- Email: info@bobediitgroup.co.za

---

## ⚡ Next Steps

1. **Read**: [QUICK_START.md](QUICK_START.md)
2. **Deploy**: Choose Vercel or Supabase
3. **Configure**: Set up Resend webhook and DNS
4. **Test**: Send email to info@bobediitgroup.co.za
5. **Monitor**: Check logs and verify everything works

**🎯 Goal**: Get emails flowing to info@bobediitgroup.co.za within 1 hour!

# Deploy to Vercel - Quick Guide

## Prerequisites
- Vercel account (free): https://vercel.com/signup
- Vercel CLI installed: `npm install -g vercel`

## Step 1: Prepare for Deployment

The project is already configured with `vercel.json`. Verify the configuration:

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

## Step 2: Deploy

### First Time Deployment

1. **Login to Vercel**:
```bash
vercel login
```

2. **Deploy**:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- What's your project's name? **bobedi-email** (or press Enter)
- In which directory is your code located? **./** (press Enter)
- Want to modify settings? **N**

3. **Wait for deployment** (usually takes 1-2 minutes)

4. **Note your deployment URL**, e.g., `https://bobedi-email.vercel.app`

### Subsequent Deployments

For production deployment:
```bash
vercel --prod
```

## Step 3: Configure Environment Variables

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Select your project**: bobedi-email

3. **Go to Settings > Environment Variables**

4. **Add these variables**:
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_WEBHOOK_SECRET`: (Optional) Webhook secret for security
   - `NODE_ENV`: production

5. **Redeploy** for variables to take effect:
```bash
vercel --prod
```

## Step 4: Configure Webhook in Resend

1. **Go to Resend Dashboard**: https://resend.com/webhooks

2. **Add Webhook**:
   - URL: `https://your-project.vercel.app/inbound-email`
   - Events: `email.received`
   - (Optional) Add secret and save it to environment variables

3. **Test the webhook** using Resend's test feature

## Step 5: Configure Inbound Email

1. **Go to**: https://resend.com/inbound

2. **Add domain**: bobediitgroup.co.za

3. **Add route**:
   - Match: `info@bobediitgroup.co.za` or `*@bobediitgroup.co.za`
   - Forward to: Webhook
   - Webhook URL: `https://your-project.vercel.app/inbound-email`

## Step 6: Test

Send an email to `info@bobediitgroup.co.za` and:
1. Check Vercel logs: `vercel logs`
2. Verify email in your web interface
3. Check Gmail for forwarded copy

## Useful Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# View deployment info
vercel inspect

# Remove deployment
vercel remove [deployment-url]

# Open project in browser
vercel open
```

## Troubleshooting

### Deployment Failed
- Check Node.js version in package.json (minimum 18.0.0)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Webhook Not Working
- Verify URL is correct (must be HTTPS)
- Check environment variables are set
- View logs: `vercel logs --follow`
- Test locally first with ngrok

### Files Not Found
- Ensure `public/` directory is included
- Check routes in vercel.json
- Verify static file paths

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure environment variables
3. ✅ Set up Resend webhook
4. ✅ Configure DNS MX records (see SETUP_INBOUND_EMAIL.md)
5. ✅ Test inbound email
6. 🔒 Add webhook signature verification
7. 🔒 Set up rate limiting

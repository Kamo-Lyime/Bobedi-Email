# Troubleshooting: Emails Not Showing in Browser

## Your Situation
- ✅ Emails arriving in Resend
- ✅ Supabase functions deployed
- ❌ Emails NOT showing in browser interface

## Most Likely Issue

**Your Resend webhook is NOT pointing to your Supabase function.**

## Fix It Now

### Step 1: Configure Resend Webhook

1. Go to: https://resend.com/webhooks

2. **Check if webhook exists:**
   - If NO webhook exists → Create one
   - If webhook exists → Click to edit it

3. **Configure webhook:**
   - **URL**: `https://eylfkeqjgvlnmvbkxedv.supabase.co/functions/v1/inbound-email`
   - **Events**: Check "Email Received" (`email.received`)
   - **Active**: Make sure it's enabled
   - Click **Save**

4. **Test the webhook:**
   - Click "Send Test" button
   - Should see success message

### Step 2: Configure Resend Inbound Route

1. Go to: https://resend.com/inbound

2. **Add domain** (if not already added):
   - Domain: `bobediitgroup.co.za`
   - Follow verification steps

3. **Add/Edit route:**
   - **Match**: `info@bobediitgroup.co.za` (or `*@bobediitgroup.co.za` for all)
   - **Forward to**: Webhook
   - **Webhook URL**: `https://eylfkeqjgvlnmvbkxedv.supabase.co/functions/v1/inbound-email`
   - Click **Save**

### Step 3: Verify Database Table Exists

1. Go to: https://app.supabase.com/project/eylfkeqjgvlnmvbkxedv/editor

2. Check if `emails` table exists in the left sidebar

3. **If table doesn't exist**, run this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS emails (
     id UUID PRIMARY KEY,
     from_address TEXT,
     to_address TEXT,
     subject TEXT,
     text TEXT,
     html TEXT,
     received_at TIMESTAMPTZ,
     raw_payload JSONB
   );
   
   -- Enable Row Level Security
   ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
   
   -- Create policy to allow reading emails
   CREATE POLICY "Allow public read access"
     ON emails FOR SELECT
     USING (true);
   ```

4. Click **Run** in the SQL editor

### Step 4: Test End-to-End

1. **Send test email** to `info@bobediitgroup.co.za`

2. **Check Resend webhook delivery:**
   - Go to: https://resend.com/webhooks
   - Click on your webhook
   - Check "Recent Deliveries" tab
   - Should show successful delivery (200 status)

3. **Check Supabase database:**
   - Go to: https://app.supabase.com/project/eylfkeqjgvlnmvbkxedv/editor
   - Click on `emails` table
   - Should see your test email

4. **Check browser:**
   - Open: `C:\Users\Kamono\Desktop\bobedi-email\public\index.html`
   - Or upload to hosting and open the URL
   - Should see emails listed

### Step 5: Check Supabase Function Logs

1. In terminal, run:
   ```powershell
   supabase functions logs inbound-email
   ```

2. Or check online:
   - Go to: https://app.supabase.com/project/eylfkeqjgvlnmvbkxedv/logs/edge-functions
   - Select `inbound-email` function
   - Look for recent logs

---

## Common Issues & Fixes

### Issue: "Table 'emails' does not exist"
**Fix**: Run the SQL in Step 3 above

### Issue: Webhook shows 404 error
**Fix**: Make sure URL is exactly:
`https://eylfkeqjgvlnmvbkxedv.supabase.co/functions/v1/inbound-email`
(Note: `/functions/v1/` is required)

### Issue: Webhook shows 401/403 error
**Fix**: The webhook doesn't need authentication headers. Remove any API key from webhook configuration.

### Issue: Emails in database but not in browser
**Fix**: 
1. Open browser console (F12)
2. Look for CORS errors or network errors
3. Make sure `index.html` is served from a web server, not file://

### Issue: Browser shows CORS error
**Fix**: The Supabase function already has CORS headers. Make sure:
1. You're using the correct anon key in index.html (already configured)
2. Open index.html through a local server:
   ```powershell
   npm start
   ```
   Then open: http://localhost:3000

---

## Quick Checklist

- [ ] Resend webhook URL: `https://eylfkeqjgvlnmvbkxedv.supabase.co/functions/v1/inbound-email`
- [ ] Resend webhook event: "Email Received" checked
- [ ] Resend webhook status: Active
- [ ] Resend inbound route configured
- [ ] Supabase `emails` table exists
- [ ] Table has RLS policy for public read
- [ ] Test email sent
- [ ] Webhook delivery shows 200 status
- [ ] Email appears in Supabase database
- [ ] Browser opened via http:// (not file://)

---

## Test Your Setup

Run this in PowerShell to test the API endpoint:

```powershell
# Test if API returns emails
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bGZrZXFqZ3Zsbm12Ymt4ZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODkwNjIsImV4cCI6MjA3OTk2NTA2Mn0.lEETpmNY7YPQF3KxChtZsTPBDyHyZMPBL2v9wbvy6gc"
}
$response = Invoke-RestMethod -Uri "https://eylfkeqjgvlnmvbkxedv.supabase.co/functions/v1/email-api/emails" -Headers $headers
$response | ConvertTo-Json
```

If you see `{ "emails": [] }` → Good! API works but no emails yet  
If you see emails → API works and has emails  
If you see error → There's a configuration issue

---

## Next Steps

1. **Fix Resend webhook** (most likely issue)
2. **Verify database table** exists
3. **Send test email**
4. **Check webhook delivery** in Resend dashboard
5. **Check database** for the email
6. **Open browser** via local server (npm start)

Once you complete these steps, emails should appear in your browser!

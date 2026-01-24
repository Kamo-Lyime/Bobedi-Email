# Email Flow Architecture

## Current State (NOT Receiving Emails)

```
External Email Sender
        │
        ├─> Sends to: info@bobediitgroup.co.za
        │
        ❌ FAILS HERE - No MX records configured
        │
        X Email bounces or goes to void
```

## Target State (After Setup)

### Receiving Emails Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. External Sender                                               │
│    (Gmail, Outlook, etc.)                                        │
│    sends to: info@bobediitgroup.co.za                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. DNS MX Records                                                │
│    bobediitgroup.co.za → Resend's Mail Server                   │
│    (Configured at your domain registrar)                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Resend Mail Server                                            │
│    Receives the email                                            │
│    Processes through inbound rules                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Resend Inbound Route                                          │
│    Match: info@bobediitgroup.co.za                              │
│    Action: Forward to Webhook                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Resend Webhook                                                │
│    POST https://your-deployment.com/inbound-email               │
│    Payload: { type: "email.received", data: {...} }            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Your Server (Express or Supabase Edge Function)              │
│    • Receives webhook POST request                              │
│    • Extracts email data                                        │
│    • Stores email in database/JSON file                        │
│    • Forwards to bobedi.it@gmail.com                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─────────────────┬──────────────────┬────────────┤
                 ▼                 ▼                  ▼            ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐
         │ emails.json  │  │  Supabase DB │  │ Gmail Backup │  │ Web UI     │
         │ (local file) │  │   (optional) │  │ bobedi.it@   │  │ Dashboard  │
         │              │  │              │  │ gmail.com    │  │            │
         └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘
```

### Sending Emails Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User composes email                                           │
│    Web Interface (localhost:3000 or deployed URL)               │
│    • To: recipient@example.com                                  │
│    • Subject: ...                                               │
│    • Message: ...                                               │
│    • Attachments: (optional)                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST to /api/compose or /api/reply                           │
│    FormData with email details                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Your Server                                                   │
│    • Adds email signature                                       │
│    • Processes attachments                                      │
│    • Calls Resend API                                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Resend API                                                    │
│    From: info@bobediitgroup.co.za                               │
│    To: recipient@example.com                                    │
│    Sends via SMTP                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Recipient's Email Server                                     │
│    Delivers to recipient's inbox                                │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. If recipient replies...                                       │
│    Reply goes to: info@bobediitgroup.co.za                      │
│    → Loops back to "Receiving Emails Flow" above ↑              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. DNS Configuration
- **MX Records**: Point bobediitgroup.co.za to Resend's mail servers
- **Purpose**: Tell other mail servers where to deliver emails for your domain
- **Status**: ❌ NOT CONFIGURED (Your issue!)

### 2. Resend Service
- **Inbound Email**: Receives emails via MX records
- **Webhook**: Notifies your server when email arrives
- **Outbound Email**: Sends emails via API
- **Status**: ✅ Account exists, ❌ Inbound not configured

### 3. Your Server
**Option A: Express Server (index.js)**
- Runs on Node.js
- Hosts web interface
- Webhook endpoint: `/inbound-email`
- Storage: emails.json file
- **Status**: ✅ Code ready, ❌ Not deployed publicly

**Option B: Supabase Edge Functions**
- Runs on Deno
- Serverless/edge runtime
- Webhook endpoint: `/functions/v1/inbound-email`
- Storage: Supabase database
- **Status**: ✅ Code ready, ❌ Not deployed

### 4. Storage
**emails.json (Local)**
- Simple file-based storage
- Good for development
- Limited scalability

**Supabase Database (Cloud)**
- Postgres database
- Scalable
- Query support
- Real-time subscriptions

### 5. Email Forwarding
- All inbound emails → bobedi.it@gmail.com
- Acts as backup
- Immediate notification
- **Status**: ✅ Code ready

## Deployment Options Comparison

### Vercel
```
Your Code (Express)
     │
     ├─> Vercel Platform
     │   ├─ Serverless Functions
     │   ├─ Environment Variables
     │   └─ Logs & Analytics
     │
     └─> Public URL: https://your-project.vercel.app
```

### Supabase
```
Your Code (Edge Functions)
     │
     ├─> Supabase Platform
     │   ├─ Edge Runtime (Deno)
     │   ├─ Database (Postgres)
     │   ├─ Authentication
     │   └─ Real-time
     │
     └─> Public URL: https://xxx.supabase.co/functions/v1/inbound-email
```

### ngrok (Testing Only)
```
Your Local Server (localhost:3000)
     │
     ├─> ngrok Tunnel
     │   └─ Creates temporary public URL
     │
     └─> Public URL: https://abc123.ngrok.io
         (Changes every time you restart ngrok)
```

## What You Need to Fix

### ❌ Problem 1: No Public Webhook
**Current**: Webhook endpoint only on localhost  
**Solution**: Deploy to Vercel, Supabase, or use ngrok  
**Impact**: Cannot receive any external emails

### ❌ Problem 2: No MX Records
**Current**: No DNS MX records for bobediitgroup.co.za  
**Solution**: Add MX records at your domain registrar  
**Impact**: Emails to your domain bounce or fail

### ❌ Problem 3: Resend Not Configured
**Current**: No webhook or inbound route in Resend  
**Solution**: Configure in Resend dashboard  
**Impact**: Resend doesn't know where to send emails

## Step-by-Step Fix

```
Step 1: Deploy Webhook
    └─> Makes /inbound-email publicly accessible
        └─> Get public URL (e.g., https://your-app.vercel.app)

Step 2: Configure Resend Webhook
    └─> Tell Resend to POST to your URL when email arrives
        └─> Resend knows where to send email events

Step 3: Configure Resend Inbound Route
    └─> Tell Resend to forward info@bobediitgroup.co.za to webhook
        └─> Emails for your address get routed correctly

Step 4: Configure DNS MX Records
    └─> Point bobediitgroup.co.za to Resend's mail servers
        └─> Other servers know where to deliver your emails

Step 5: Test
    └─> Send email to info@bobediitgroup.co.za
        └─> Should appear in your system!
```

## Success Checklist

When everything is working:

✅ MX records at bobediitgroup.co.za → Resend mail server  
✅ Webhook endpoint publicly accessible  
✅ Resend webhook configured  
✅ Resend inbound route configured  
✅ Test email sent to info@bobediitgroup.co.za  
✅ Email appears in your web interface  
✅ Email forwarded to bobedi.it@gmail.com  
✅ Can reply to received emails  
✅ Replies come back to your system  

## Timeline

- **DNS Setup**: 5 minutes (+ 5-60 min propagation)
- **Deployment**: 5-10 minutes
- **Resend Config**: 5 minutes
- **Testing**: 2 minutes
- **Total**: ~1 hour including DNS wait time

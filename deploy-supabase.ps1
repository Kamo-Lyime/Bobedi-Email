# Deploy Supabase Edge Functions - PowerShell Script
# This script deploys the email-api and inbound-email functions to Supabase

Write-Host "🚀 Deploying Supabase Edge Functions for Bobedi Email" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host "📋 Step 1: Login to Supabase" -ForegroundColor Green
supabase login

Write-Host ""
Write-Host "📋 Step 2: Link to your Supabase project" -ForegroundColor Green
Write-Host "You'll need your project reference ID from: https://app.supabase.com/project/_/settings/general"
Write-Host ""
$PROJECT_REF = Read-Host -Prompt "Enter your Supabase project reference ID"

supabase link --project-ref $PROJECT_REF

Write-Host ""
Write-Host "📋 Step 3: Set environment variables" -ForegroundColor Green
Write-Host ""
$RESEND_KEY = Read-Host -Prompt "Enter your RESEND_API_KEY"
$SUPABASE_URL = Read-Host -Prompt "Enter your SUPABASE_URL (example: https://xxx.supabase.co)"
$SERVICE_KEY = Read-Host -Prompt "Enter your SUPABASE_SERVICE_ROLE_KEY"
Write-Host "Enter your RESEND_WEBHOOK_SECRET (optional - leave blank to skip):"
$WEBHOOK_SECRET = Read-Host

Write-Host ""
Write-Host "Setting secrets..." -ForegroundColor Yellow
supabase secrets set RESEND_API_KEY="$RESEND_KEY"
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"

if ($WEBHOOK_SECRET) {
    supabase secrets set RESEND_WEBHOOK_SECRET="$WEBHOOK_SECRET"
}

Write-Host ""
Write-Host "📋 Step 4: Deploy functions" -ForegroundColor Green
Write-Host ""

Write-Host "Deploying inbound-email function..." -ForegroundColor Yellow
supabase functions deploy inbound-email

Write-Host ""
Write-Host "Deploying email-api function..." -ForegroundColor Yellow
supabase functions deploy email-api

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Your function URLs:" -ForegroundColor Cyan
Write-Host "   Inbound Email: https://$PROJECT_REF.supabase.co/functions/v1/inbound-email"
Write-Host "   Email API:     https://$PROJECT_REF.supabase.co/functions/v1/email-api"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Green
Write-Host "1. Configure webhook in Resend dashboard:"
Write-Host "   - URL: https://$PROJECT_REF.supabase.co/functions/v1/inbound-email"
Write-Host "   - Event: email.received"
Write-Host ""
Write-Host "2. Configure inbound email route in Resend:"
Write-Host "   - Domain: bobediitgroup.co.za"
Write-Host "   - Route: info@bobediitgroup.co.za → Webhook"
Write-Host "   - Webhook URL: https://$PROJECT_REF.supabase.co/functions/v1/inbound-email"
Write-Host ""
Write-Host "3. Test by sending an email to info@bobediitgroup.co.za"
Write-Host ""
Write-Host "4. View logs:"
Write-Host "   supabase functions logs inbound-email"
Write-Host ""

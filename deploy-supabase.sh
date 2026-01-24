#!/bin/bash

# Deploy Supabase Edge Functions
# This script deploys the email-api and inbound-email functions to Supabase

echo "🚀 Deploying Supabase Edge Functions for Bobedi Email"
echo "======================================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📋 Step 1: Login to Supabase"
supabase login

echo ""
echo "📋 Step 2: Link to your Supabase project"
echo "You'll need your project reference ID from: https://app.supabase.com/project/_/settings/general"
echo ""
read -p "Enter your Supabase project reference ID: " PROJECT_REF

supabase link --project-ref $PROJECT_REF

echo ""
echo "📋 Step 3: Set environment variables"
echo ""
read -p "Enter your RESEND_API_KEY: " RESEND_KEY
read -p "Enter your SUPABASE_URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
read -p "Enter your SUPABASE_SERVICE_ROLE_KEY: " SERVICE_KEY
read -p "Enter your RESEND_WEBHOOK_SECRET (optional, press Enter to skip): " WEBHOOK_SECRET

echo ""
echo "Setting secrets..."
supabase secrets set RESEND_API_KEY="$RESEND_KEY"
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"

if [ ! -z "$WEBHOOK_SECRET" ]; then
    supabase secrets set RESEND_WEBHOOK_SECRET="$WEBHOOK_SECRET"
fi

echo ""
echo "📋 Step 4: Deploy functions"
echo ""

echo "Deploying inbound-email function..."
supabase functions deploy inbound-email

echo ""
echo "Deploying email-api function..."
supabase functions deploy email-api

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Your function URLs:"
echo "   Inbound Email: https://$PROJECT_REF.supabase.co/functions/v1/inbound-email"
echo "   Email API:     https://$PROJECT_REF.supabase.co/functions/v1/email-api"
echo ""
echo "📋 Next steps:"
echo "1. Configure webhook in Resend dashboard:"
echo "   - URL: https://$PROJECT_REF.supabase.co/functions/v1/inbound-email"
echo "   - Event: email.received"
echo ""
echo "2. Configure inbound email route in Resend:"
echo "   - Domain: bobediitgroup.co.za"
echo "   - Route: info@bobediitgroup.co.za → Webhook"
echo "   - Webhook URL: https://$PROJECT_REF.supabase.co/functions/v1/inbound-email"
echo ""
echo "3. Test by sending an email to info@bobediitgroup.co.za"
echo ""
echo "4. View logs:"
echo "   supabase functions logs inbound-email"
echo ""
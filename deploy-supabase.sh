#!/bin/bash
# Deploy Supabase functions
echo "Deploying Supabase Edge Functions..."

# Deploy the inbound email function
supabase functions deploy inbound-email

# Set environment variables
supabase secrets set RESEND_API_KEY=your_resend_api_key_here

echo "Deployment complete!"
echo "Don't forget to:"
echo "1. Set your RESEND_API_KEY secret in Supabase dashboard"
echo "2. Configure your email webhook to point to your Supabase function URL"
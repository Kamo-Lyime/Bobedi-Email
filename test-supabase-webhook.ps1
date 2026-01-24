# Test Supabase Webhook Endpoint
# This simulates what Resend sends to your webhook

Write-Host "🧪 Testing Supabase Inbound Email Webhook" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$webhookUrl = "https://eylfkeqjgvlnmvbkxedv.supabase.co/functions/v1/inbound-email"

$testPayload = @{
    type = "email.received"
    data = @{
        from = "test@example.com"
        to = "info@bobediitgroup.co.za"
        subject = "Test Email - Webhook Test"
        text = "This is a test email to verify the webhook is working."
        html = "<p>This is a <strong>test email</strong> to verify the webhook is working.</p>"
        timestamp = (Get-Date).ToString("o")
        message_id = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending test webhook to:" -ForegroundColor Yellow
Write-Host "   $webhookUrl" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ""
    Write-Host "✅ Webhook is working! Now check:" -ForegroundColor Green
    Write-Host "1. Supabase Database: https://app.supabase.com/project/eylfkeqjgvlnmvbkxedv/editor" -ForegroundColor White
    Write-Host "2. Click 'emails' table - you should see the test email" -ForegroundColor White
    Write-Host "3. Check Gmail: bobedi.it@gmail.com for forwarded copy" -ForegroundColor White
}
catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 404) {
            Write-Host "❌ 404 Error - Function not found!" -ForegroundColor Red
            Write-Host "Make sure you deployed the function:" -ForegroundColor Yellow
            Write-Host "   supabase functions deploy inbound-email" -ForegroundColor White
        }
        elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "❌ Authentication Error" -ForegroundColor Red
            Write-Host "Check your Supabase secrets are set correctly" -ForegroundColor Yellow
        }
        elseif ($statusCode -eq 500) {
            Write-Host "❌ Server Error - Check Supabase logs" -ForegroundColor Red
            Write-Host "Run: supabase functions logs inbound-email" -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email sending will be disabled.');
}

export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:43210';

export async function sendWelcomeEmail(email: string, name: string) {
  if (!resend) {
    console.warn('Resend not configured, skipping welcome email');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to ScreenAPI! 🎉',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ScreenAPI!</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      
      <p>Thanks for signing up! We're excited to have you on board. 🚀</p>
      
      <p>You now have access to:</p>
      
      <div class="feature">
        <strong>📸 100 free screenshots per day</strong><br>
        Perfect for testing and small projects
      </div>
      
      <div class="feature">
        <strong>🕷️ 50 web scraping requests per day</strong><br>
        Extract data from any webpage
      </div>
      
      <div class="feature">
        <strong>📱 20+ device presets</strong><br>
        iPhone, Samsung, iPad, Desktop and more
      </div>
      
      <div class="feature">
        <strong>⚡ 10 requests per minute</strong><br>
        Fast and reliable API
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
      </p>
      
      <h3>Quick Start:</h3>
      <ol>
        <li>Visit your <a href="${APP_URL}/dashboard">Dashboard</a></li>
        <li>Copy your API key</li>
        <li>Try the <a href="${APP_URL}/playground">Playground</a></li>
        <li>Read the <a href="${APP_URL}/docs">Documentation</a></li>
      </ol>
      
      <p>Need help? Check out our <a href="${APP_URL}/docs">documentation</a> or reply to this email.</p>
      
      <p>Happy coding! 💻</p>
      
      <p>
        Best regards,<br>
        The ScreenAPI Team
      </p>
    </div>
    <div class="footer">
      <p>ScreenAPI - Professional Screenshot & Web Scraping API</p>
      <p>${APP_URL}</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendPaymentSuccessEmail(
  email: string,
  name: string,
  plan: string,
  amount: number
) {
  if (!resend) {
    console.warn('Resend not configured, skipping payment success email');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Payment Successful - ${plan} Plan Activated! 🎉`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Successful!</h1>
      <div class="success-badge">✓ ${plan} Plan Activated</div>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      
      <p>Your payment has been processed successfully and your ${plan} plan is now active! 🎉</p>
      
      <div class="details">
        <h3>Payment Details</h3>
        <table style="width: 100%;">
          <tr>
            <td><strong>Plan:</strong></td>
            <td>${plan}</td>
          </tr>
          <tr>
            <td><strong>Amount:</strong></td>
            <td>$${(amount / 100).toFixed(2)} USD</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td style="color: #10b981;">Active</td>
          </tr>
        </table>
      </div>
      
      <h3>Your New Limits:</h3>
      <ul>
        <li>${plan === 'PRO' ? '10,000 screenshots/day' : 'Unlimited screenshots'}</li>
        <li>${plan === 'PRO' ? '5,000 scraping requests/day' : 'Unlimited scraping'}</li>
        <li>${plan === 'PRO' ? '100 requests/minute' : 'Custom rate limits'}</li>
        <li>Priority support</li>
        <li>99.9% uptime SLA</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/dashboard" class="button">View Dashboard</a>
      </p>
      
      <p>Need to manage your subscription? Visit your <a href="${APP_URL}/account">Account Settings</a>.</p>
      
      <p>
        Best regards,<br>
        The ScreenAPI Team
      </p>
    </div>
    <div class="footer">
      <p>ScreenAPI - Professional Screenshot & Web Scraping API</p>
      <p>${APP_URL}</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log(`Payment success email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send payment success email:', error);
  }
}

export async function sendPaymentFailedEmail(
  email: string,
  name: string,
  reason: string
) {
  if (!resend) {
    console.warn('Resend not configured, skipping payment failed email');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Payment Failed - Action Required',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      
      <p>We were unable to process your payment.</p>
      
      <div class="warning">
        <strong>Reason:</strong> ${reason}
      </div>
      
      <p>To continue using your premium features, please update your payment method:</p>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/account" class="button">Update Payment Method</a>
      </p>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>
        Best regards,<br>
        The ScreenAPI Team
      </p>
    </div>
    <div class="footer">
      <p>ScreenAPI - Professional Screenshot & Web Scraping API</p>
      <p>${APP_URL}</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log(`Payment failed email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  name: string
) {
  if (!resend) {
    console.warn('Resend not configured, skipping subscription cancelled email');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Subscription Cancelled - We\'re Sorry to See You Go',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Subscription Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      
      <p>Your subscription has been cancelled as requested. We're sorry to see you go! 😢</p>
      
      <div class="info">
        <p>Your premium features will remain active until the end of your billing period. After that, you'll be automatically downgraded to the Free plan.</p>
        
        <p><strong>Free plan includes:</strong></p>
        <ul>
          <li>100 screenshots per day</li>
          <li>50 scraping requests per day</li>
          <li>All device presets</li>
          <li>Community support</li>
        </ul>
      </div>
      
      <p>Changed your mind? You can reactivate your subscription anytime:</p>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/pricing" class="button">View Plans</a>
      </p>
      
      <p>We'd love to hear your feedback! Reply to this email and let us know how we can improve.</p>
      
      <p>
        Best regards,<br>
        The ScreenAPI Team
      </p>
    </div>
    <div class="footer">
      <p>ScreenAPI - Professional Screenshot & Web Scraping API</p>
      <p>${APP_URL}</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log(`Subscription cancelled email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send subscription cancelled email:', error);
  }
}

import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"nXtDate" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

export function generateVerificationEmailTemplate(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - nXtDate</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: linear-gradient(145deg, #ffffff 0%, #fef5f7 100%);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(237, 95, 133, 0.12);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #ED5F85 0%, #9D56D9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .heart {
            font-size: 40px;
            margin-bottom: 20px;
          }
          h1 {
            color: #340515;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ED5F85 0%, #9D56D9 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-weight: bold;
            margin: 30px 0;
            box-shadow: 0 8px 24px rgba(237, 95, 133, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover {
            box-shadow: 0 12px 32px rgba(237, 95, 133, 0.4);
            transform: translateY(-2px);
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 14px;
          }
          .link {
            color: #ED5F85;
            text-decoration: none;
            word-break: break-all;
          }
          .warning {
            background-color: #fff8f0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="heart">💖</div>
            <div class="logo">nXtDate</div>
          </div>
          
          <h1>Hi ${name}! 👋</h1>
          
          <p>Welcome to nXtDate! We're excited to help you find meaningful connections.</p>
          
          <p>To get started, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p style="font-size: 14px; color: #888;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px;"><a href="${verificationUrl}" class="link">${verificationUrl}</a></p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with nXtDate, you can safely ignore this email.
          </div>
          
          <p>Once verified, you'll be able to:</p>
          <ul style="color: #666;">
            <li>✨ Discover AI-powered matches</li>
            <li>💬 Start meaningful conversations</li>
            <li>❤️ Connect with like-minded people</li>
          </ul>
          
          <div class="footer">
            <p>Questions? Contact us at support@nxtdate.com</p>
            <p>&copy; ${new Date().getFullYear()} nXtDate. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateWelcomeEmailTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to nXtDate!</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: linear-gradient(145deg, #ffffff 0%, #fef5f7 100%);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(237, 95, 133, 0.12);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #ED5F85 0%, #9D56D9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .celebration {
            font-size: 60px;
            margin: 20px 0;
          }
          h1 {
            color: #340515;
            font-size: 28px;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ED5F85 0%, #9D56D9 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-weight: bold;
            margin: 30px 0;
            box-shadow: 0 8px 24px rgba(237, 95, 133, 0.3);
          }
          .tips {
            background-color: #f9f9f9;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .tip-item {
            margin: 15px 0;
            padding-left: 30px;
            position: relative;
          }
          .tip-emoji {
            position: absolute;
            left: 0;
            font-size: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="celebration">🎉</div>
            <div class="logo">nXtDate</div>
          </div>
          
          <h1>Welcome, ${name}! 💖</h1>
          
          <p>Your email has been verified successfully! You're all set to start your journey to finding meaningful connections.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/discover" class="button">Start Discovering Matches</a>
          </div>
          
          <div class="tips">
            <h2 style="color: #ED5F85; margin-top: 0;">✨ Tips to Get Started:</h2>
            
            <div class="tip-item">
              <span class="tip-emoji">📸</span>
              <strong>Complete Your Profile:</strong> Add a great photo and write an engaging bio to attract more matches.
            </div>
            
            <div class="tip-item">
              <span class="tip-emoji">🎯</span>
              <strong>Add Your Interests:</strong> Let our AI know what you love to find better matches.
            </div>
            
            <div class="tip-item">
              <span class="tip-emoji">💬</span>
              <strong>Be Authentic:</strong> Be yourself and start genuine conversations.
            </div>
            
            <div class="tip-item">
              <span class="tip-emoji">❤️</span>
              <strong>Stay Active:</strong> The more you engage, the better your matches!
            </div>
          </div>
          
          <p style="text-align: center; color: #ED5F85; font-weight: bold; font-size: 18px;">
            Let the magic begin! ✨
          </p>
          
          <div class="footer">
            <p>Need help? Contact us at support@nxtdate.com</p>
            <p>&copy; ${new Date().getFullYear()} nXtDate. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

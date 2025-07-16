const nodemailer = require('nodemailer');

// Email service configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // For development, use hardcoded Gmail credentials
    // In production, these should come from environment variables
    const emailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'hrmsystem.demo@gmail.com', // Hardcoded for demo
        pass: process.env.EMAIL_PASS || 'demo_app_password_here' // This would be an app password
      }
    };

    // If no real credentials are provided, use Ethereal for testing
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('No real email credentials found. Using test account...');
      this.createTestAccount();
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service connection failed:', error.message);
        console.log('Falling back to test account...');
        this.createTestAccount();
      } else {
        console.log('Email service connected successfully');
      }
    });
  }

  async createTestAccount() {
    try {
      // Create a test account using Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('Test email account created:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
      console.log('Preview emails at: https://ethereal.email');
    } catch (error) {
      console.error('Failed to create test account:', error);
      this.transporter = null;
    }
  }

  async sendOTPEmail(userEmail, userName, otp) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'hrmsystem.demo@gmail.com',
      to: userEmail,
      subject: 'Password Change OTP - HRM System',
      html: this.generateOTPEmailTemplate(userName, otp),
      text: `Hello ${userName}, Your OTP for password change is: ${otp}. This OTP will expire in 10 minutes.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // If using test account, log the preview URL
      if (info.messageId && nodemailer.getTestMessageUrl) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('='.repeat(60));
        console.log('EMAIL SENT SUCCESSFULLY');
        console.log('='.repeat(60));
        console.log(`To: ${userEmail}`);
        console.log(`Subject: Password Change OTP`);
        console.log(`OTP: ${otp}`);
        if (previewUrl) {
          console.log(`Preview URL: ${previewUrl}`);
        }
        console.log('='.repeat(60));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendPasswordChangeConfirmation(userEmail, userName) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'hrmsystem.demo@gmail.com',
      to: userEmail,
      subject: 'Password Changed Successfully - HRM System',
      html: this.generatePasswordChangeConfirmationTemplate(userName),
      text: `Hello ${userName}, Your password has been successfully changed. If you did not make this change, please contact your administrator immediately.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (info.messageId && nodemailer.getTestMessageUrl) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Password change confirmation email sent');
        if (previewUrl) {
          console.log(`Preview URL: ${previewUrl}`);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw error for confirmation email failure
      return { success: false, error: error.message };
    }
  }

  generateOTPEmailTemplate(userName, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Change OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background-color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #007bff; }
          .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 10px 0; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Change Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>You have requested to change your password for your HRM System account. Please use the following One-Time Password (OTP) to complete the process:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 16px;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6c757d;">Enter this code in the application</p>
            </div>

            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0;">
                <li>This OTP will expire in <strong>10 minutes</strong></li>
                <li>Do not share this code with anyone</li>
                <li>If you did not request this password change, please ignore this email and contact your administrator immediately</li>
              </ul>
            </div>

            <p>For your security, this is an automated email. Please do not reply to this message.</p>
          </div>
          <div class="footer">
            <p>© 2024 HRM Management System. All rights reserved.</p>
            <p>This email was sent to your registered email address</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordChangeConfirmationTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <div class="success-box">
              <h3 style="color: #155724; margin-top: 0;">Your password has been successfully updated!</h3>
              <p style="margin-bottom: 0;">Changed on: ${new Date().toLocaleString()}</p>
            </div>

            <p>Your HRM System account password has been successfully changed. You can now use your new password to log in to the system.</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p style="margin: 10px 0;">If you did not make this change, please contact your system administrator immediately at <strong>admin@company.com</strong> or through your organization's IT support.</p>
            </div>

            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Keep your password confidential</li>
              <li>Use a strong, unique password</li>
              <li>Log out from shared computers</li>
              <li>Report any suspicious activity</li>
            </ul>

            <p>Thank you for keeping your account secure!</p>
          </div>
          <div class="footer">
            <p>© 2024 HRM Management System. All rights reserved.</p>
            <p>This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export a singleton instance
module.exports = new EmailService();

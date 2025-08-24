const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Use Gmail if EMAIL_USER is configured, otherwise use Ethereal Email for testing
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Gmail email configuration
      console.log('📧 Initializing Gmail transporter...');
      console.log('📧 Email service:', process.env.EMAIL_SERVICE);
      console.log('📧 Email user:', process.env.EMAIL_USER);
      console.log('📧 Email from:', process.env.EMAIL_FROM);
      
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        timeout: 10000, // 10 second timeout
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });
    } else {
      // Development: Use Ethereal Email for testing
      console.log('📧 Initializing test email service for development...');
      this.createTestAccount();
    }
  }

  async createTestAccount() {
    try {
      // Create a test account for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('📧 Email service initialized with test account');
      console.log('Test account:', testAccount.user);
    } catch (error) {
      console.error('Failed to create test email account:', error);
      // Fallback: create a simple transporter without authentication
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  }

  async sendVerificationCode(email, code) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CareGrid" <noreply@caregrid.com>',
        to: email,
        subject: 'Password Reset Verification Code - CareGrid',
        html: this.generateVerificationEmailTemplate(code)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log the result
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Verification email sent successfully');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      console.error('Email configuration check:');
      console.error('  EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
      console.error('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Missing');
      console.error('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'Not set (default: gmail)');
      console.error('  NODE_ENV:', process.env.NODE_ENV || 'Not set');
      
      // Provide more specific error messages
      let userFriendlyError = 'Failed to send verification email';
      if (error.code === 'EDNS' || error.code === 'ENOTFOUND') {
        userFriendlyError = 'Network error: Cannot connect to email server';
      } else if (error.code === 'EAUTH') {
        userFriendlyError = 'Email authentication failed. Please check your email credentials.';
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ETIMEOUT') {
        userFriendlyError = 'Email service timeout. Please try again.';
      }
      
      return {
        success: false,
        error: userFriendlyError,
        technicalError: error.message
      };
    }
  }

  generateVerificationEmailTemplate(code) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - CareGrid</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2a6ef3;
            margin-bottom: 10px;
          }
          .code-container {
            background: #f8f9ff;
            border: 2px solid #2a6ef3;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .verification-code {
            font-size: 32px;
            font-weight: bold;
            color: #2a6ef3;
            letter-spacing: 4px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CareGrid</div>
            <h2>Password Reset Request</h2>
          </div>
          
          <p>Hello,</p>
          
          <p>We received a request to reset your password for your CareGrid account. Use the verification code below to proceed with resetting your password:</p>
          
          <div class="code-container">
            <p><strong>Your Verification Code:</strong></p>
            <div class="verification-code">${code}</div>
            <p><small>This code will expire in 15 minutes</small></p>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
          </div>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
          
          <div class="footer">
            <p>Best regards,<br>The CareGrid Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CareGrid" <noreply@caregrid.com>',
        to: email,
        subject: 'Welcome to CareGrid!',
        html: this.generateWelcomeEmailTemplate(name)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Welcome email sent successfully');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to CareGrid</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #2a6ef3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CareGrid</div>
            <h2>Welcome to CareGrid!</h2>
          </div>
          <p>Hello ${name},</p>
          <p>Welcome to CareGrid! Your account has been successfully created.</p>
          <p>You can now book appointments with healthcare providers and manage your healthcare needs.</p>
          <p>Best regards,<br>The CareGrid Team</p>
        </div>
      </body>
      </html>
    `;
  }

  async sendContactFormNotification(contactData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CareGrid" <noreply@caregrid.com>',
        to: 'caregriduk@gmail.com',
        subject: `New Contact Form Submission - ${contactData.subject}`,
        html: this.generateContactFormEmailTemplate(contactData)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Contact form notification sent successfully');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Failed to send contact form notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBookingConfirmation(email, bookingData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CareGrid" <noreply@caregrid.com>',
        to: email,
        subject: 'Appointment Confirmation - CareGrid',
        html: this.generateBookingConfirmationTemplate(bookingData)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Booking confirmation email sent successfully');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateContactFormEmailTemplate(contactData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .logo { font-size: 28px; font-weight: bold; color: #2a6ef3; }
          .info-section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .info-label { font-weight: bold; color: #2a6ef3; }
          .message-content { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CareGrid</div>
            <h2>New Contact Form Submission</h2>
          </div>
          
          <div class="info-section">
            <p><span class="info-label">Name:</span> ${contactData.firstName} ${contactData.lastName}</p>
            <p><span class="info-label">Email:</span> ${contactData.email}</p>
            <p><span class="info-label">Phone:</span> ${contactData.phone || 'Not provided'}</p>
            <p><span class="info-label">Subject:</span> ${contactData.subject}</p>
            <p><span class="info-label">Submitted:</span> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="message-content">
            <h3>Message:</h3>
            <p>${contactData.message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p><small>This message was sent from the CareGrid contact form.</small></p>
        </div>
      </body>
      </html>
    `;
  }

  generateBookingConfirmationTemplate(bookingData) {
    const { appointment, clinic } = bookingData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation - CareGrid</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2a6ef3;
            margin-bottom: 10px;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background: #27AE60;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 1.8rem;
          }
          .booking-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #2a6ef3;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .booking-ref {
            font-weight: bold;
            color: #2a6ef3;
            font-size: 1.1rem;
          }
          .important-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #2a6ef3;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CareGrid</div>
            <div class="success-icon">✓</div>
            <h2 style="color: #2a6ef3; margin: 0;">Appointment Confirmed!</h2>
            <p style="color: #666; margin: 10px 0 0 0;">Your appointment has been successfully booked</p>
          </div>
          
          <div class="booking-details">
            <h3 style="margin: 0 0 20px 0; color: #2a6ef3;">Appointment Details</h3>
            
            <div class="detail-row">
              <strong>Booking Reference:</strong>
              <span class="booking-ref">${appointment.reference}</span>
            </div>
            
            <div class="detail-row">
              <strong>Clinic:</strong>
              <span>${clinic.name}</span>
            </div>
            
            <div class="detail-row">
              <strong>Date & Time:</strong>
              <span>${new Date(appointment.appointmentDate).toLocaleDateString('en-GB')} at ${appointment.appointmentTime}</span>
            </div>
            
            <div class="detail-row">
              <strong>Service:</strong>
              <span>${appointment.treatmentType}</span>
            </div>
            
            ${appointment.notes ? `
            <div class="detail-row">
              <strong>Notes:</strong>
              <span>${appointment.notes}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="important-info">
            <strong>Important Information:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Please arrive 10 minutes before your appointment time</li>
              <li>Bring a valid form of identification</li>
              <li>If you need to cancel or reschedule, please contact the clinic at least 24 hours in advance</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://caregrid.netlify.app'}/dashboard.html" class="btn">
              View Dashboard
            </a>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing CareGrid for your healthcare needs.</p>
            <p><strong>Need help?</strong> Contact our support team or visit your dashboard to manage your appointments.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
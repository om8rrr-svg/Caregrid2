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
            <a href="${process.env.FRONTEND_URL || 'https://caregrid.vercel.app'}/dashboard.html" class="btn">
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

  // Send alert email
  async sendAlertEmail(alert, recipients = null) {
    try {
      const subject = `[CareGrid Alert] ${alert.severity.toUpperCase()}: ${alert.title}`;

      const htmlContent = this.generateAlertEmailTemplate(alert);

      const to = recipients || process.env.DEFAULT_ALERT_EMAIL || 'ops@caregrid.com';

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@caregrid.com',
        to,
        subject,
        html: htmlContent
      };

      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Alert email sent successfully:', info.messageId);

        if (process.env.NODE_ENV === 'development') {
          console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId };
      } else {
        console.warn('⚠️ Email transporter not initialized - cannot send alert email');
        return { success: false, error: 'Email service not configured' };
      }

    } catch (error) {
      console.error('❌ Failed to send alert email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate alert email template
  generateAlertEmailTemplate(alert) {
    const severityColor = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    }[alert.severity] || '#6c757d';

    const statusColor = {
      active: '#dc3545',
      acknowledged: '#ffc107',
      resolved: '#28a745'
    }[alert.status] || '#6c757d';

    const severityIcon = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }[alert.severity] || '⚪';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareGrid Alert</title>
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
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }
    .alert-title {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .alert-meta {
      margin: 20px 0;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid ${severityColor};
    }
    .meta-item {
      margin: 12px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .label {
      font-weight: 600;
      color: #475569;
      min-width: 100px;
    }
    .value {
      color: #1e293b;
      flex: 1;
      text-align: right;
    }
    .severity {
      padding: 6px 12px;
      border-radius: 20px;
      color: white;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      background-color: ${severityColor};
    }
    .status {
      padding: 6px 12px;
      border-radius: 20px;
      color: white;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      background-color: ${statusColor};
    }
    .description {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #3b82f6;
    }
    .description h3 {
      color: #1e40af;
      margin-top: 0;
    }
    .metadata {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .metadata h3 {
      color: #334155;
      margin-top: 0;
    }
    .metadata pre {
      background: #ffffff;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .actions {
      background: #ecfdf5;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .actions h3 {
      color: #047857;
      margin-top: 0;
    }
    .actions ul {
      margin: 0;
      padding-left: 20px;
    }
    .actions li {
      margin: 8px 0;
      color: #1e293b;
    }
    .dashboard-link {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="alert-title">${severityIcon} CareGrid System Alert</h1>
    </div>

    <div class="alert-meta">
      <div class="meta-item">
        <span class="label">Alert ID:</span>
        <span class="value">${alert.id}</span>
      </div>
      <div class="meta-item">
        <span class="label">Type:</span>
        <span class="value">${alert.type}</span>
      </div>
      <div class="meta-item">
        <span class="label">Severity:</span>
        <span class="value">
          <span class="severity">${alert.severity.toUpperCase()}</span>
        </span>
      </div>
      <div class="meta-item">
        <span class="label">Status:</span>
        <span class="value">
          <span class="status">${alert.status.toUpperCase()}</span>
        </span>
      </div>
      <div class="meta-item">
        <span class="label">Created:</span>
        <span class="value">${new Date(alert.createdAt).toLocaleString()}</span>
      </div>
    </div>

    <div class="description">
      <h3>📋 Alert Description</h3>
      <p><strong>${alert.title}</strong></p>
      <p>${alert.description || 'No additional description provided.'}</p>
    </div>

    ${alert.metadata && Object.keys(alert.metadata).length > 0 ? `
    <div class="metadata">
      <h3>📊 Additional Information</h3>
      <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
    </div>
    ` : ''}

    <div class="actions">
      <h3>🔧 Recommended Actions</h3>
      <ul>
        <li>Check the CareGrid Operations Dashboard for real-time status</li>
        <li>Review system logs and performance metrics</li>
        <li>Investigate the root cause of the issue</li>
        <li>Acknowledge this alert once you begin investigation</li>
        <li>Resolve the alert once the issue is fixed</li>
      </ul>
      <p>
        <a href="${process.env.DASHBOARD_URL || 'http://localhost:3001'}" class="dashboard-link">
          🚀 Open Operations Dashboard
        </a>
      </p>
    </div>

    <div class="footer">
      <p><strong>CareGrid Operations Monitoring</strong></p>
      <p>This is an automated alert notification. Please do not reply to this email.</p>
      <p>For support, contact: ${process.env.SUPPORT_EMAIL || 'support@caregrid.com'}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Test alert email
  async testAlertEmail() {
    const testAlert = {
      id: 'test-alert-' + Date.now(),
      type: 'health_check_failed',
      severity: 'high',
      status: 'active',
      title: 'Test Alert - Email Service Verification',
      description: 'This is a test alert to verify the email notification system is working correctly.',
      createdAt: new Date().toISOString(),
      metadata: {
        source: 'email_service_test',
        timestamp: new Date().toISOString(),
        testData: {
          emailService: 'operational',
          alerting: 'functional'
        }
      }
    };

    return await this.sendAlertEmail(testAlert);
  }

  // Get email service status
  getEmailServiceStatus() {
    return {
      initialized: !!this.transporter,
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      service: process.env.EMAIL_SERVICE || 'gmail',
      from: process.env.EMAIL_FROM || 'noreply@caregrid.com',
      defaultAlertEmail: process.env.DEFAULT_ALERT_EMAIL || 'ops@caregrid.com',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new EmailService();

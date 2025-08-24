#!/usr/bin/env node

/**
 * CareGrid Email Configuration Test Script
 *
 * This script tests the email configuration without requiring a database.
 * Run this script to verify that your Gmail configuration is working.
 *
 * Usage:
 *   node test-email-config.js [test-email-address]
 *
 * Example:
 *   node test-email-config.js your.email@gmail.com
 */

require("dotenv").config();

// Simple email service test that doesn't require database
const nodemailer = require("nodemailer");

// Get test email from command line arguments
const testEmail = process.argv[2] || "test@example.com";

console.log("🧪 CareGrid Email Configuration Test");
console.log("=====================================");
console.log("");

// Check environment variables
console.log("📋 Environment Configuration:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "Not set"}`);
console.log(
  `   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || "Not set (default: gmail)"}`,
);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || "NOT SET ❌"}`);
console.log(
  `   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? "Set ✅" : "NOT SET ❌"}`,
);
console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || "Not set"}`);
console.log("");

// Validate configuration
let configValid = true;
const errors = [];

if (
  !process.env.EMAIL_USER ||
  process.env.EMAIL_USER === "YOUR_GMAIL_ADDRESS@gmail.com"
) {
  errors.push("❌ EMAIL_USER is not set or still contains placeholder");
  configValid = false;
}

if (!process.env.EMAIL_PASSWORD) {
  errors.push("❌ EMAIL_PASSWORD is not set");
  configValid = false;
}

if (!configValid) {
  console.log("❌ Configuration Errors:");
  errors.forEach((error) => console.log(`   ${error}`));
  console.log("");
  console.log("📖 Please check EMAIL_SETUP.md for configuration instructions");
  process.exit(1);
}

console.log("✅ Basic configuration looks good!");
console.log("");

// Test email sending
async function testEmailSending() {
  console.log("📤 Testing email sending...");

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      timeout: 10000,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    // Verify SMTP connection
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");

    // Generate test verification code
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Email content
    const mailOptions = {
      from:
        process.env.EMAIL_FROM || '"CareGrid Test" <noreply@caregriduk.co.uk>',
      to: testEmail,
      subject: "[TEST] Password Reset Verification Code - CareGrid",
      html: generateTestEmailTemplate(testCode),
    };

    console.log(`📧 Sending test email to: ${testEmail}`);
    console.log(`🔢 Test verification code: ${testCode}`);

    const info = await transporter.sendMail(mailOptions);

    console.log("");
    console.log("🎉 SUCCESS! Test email sent successfully!");
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Recipient: ${testEmail}`);
    console.log(`🔢 Verification Code: ${testCode}`);
    console.log("");
    console.log("✅ Your email configuration is working correctly!");
    console.log("✅ Password reset emails will now be sent via Gmail");
  } catch (error) {
    console.log("");
    console.log("❌ EMAIL SENDING FAILED");
    console.log(`💥 Error: ${error.message}`);
    console.log("");

    // Provide specific troubleshooting tips
    if (error.code === "EAUTH") {
      console.log("🔧 Troubleshooting - Authentication Failed:");
      console.log("   • Verify your Gmail address is correct");
      console.log("   • Ensure 2FA is enabled on your Gmail account");
      console.log("   • Check that the app password is correct (no spaces)");
      console.log("   • Try generating a new app password");
    } else if (error.code === "EDNS" || error.code === "ENOTFOUND") {
      console.log("🔧 Troubleshooting - Network Error:");
      console.log("   • Check your internet connection");
      console.log("   • Verify DNS can resolve smtp.gmail.com");
      console.log("   • Check firewall/proxy settings");
    } else if (error.code === "ETIMEDOUT" || error.code === "ETIMEOUT") {
      console.log("🔧 Troubleshooting - Timeout Error:");
      console.log("   • Network connection may be slow or unstable");
      console.log("   • Try again in a few minutes");
      console.log("   • Check if port 587 (SMTP) is blocked");
    }

    console.log("");
    console.log("📖 For more help, see EMAIL_SETUP.md");
    process.exit(1);
  }
}

function generateTestEmailTemplate(code) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>[TEST] CareGrid Email Configuration</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #f8f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2a6ef3; }
            .test-banner { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
            .code-container { background: #f8f9ff; border: 2px solid #2a6ef3; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .verification-code { font-size: 28px; font-weight: bold; color: #2a6ef3; letter-spacing: 3px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">CareGrid</div>
            <p>Email Configuration Test</p>
        </div>
        
        <div class="test-banner">
            <strong>🧪 THIS IS A TEST EMAIL</strong><br>
            Your CareGrid email configuration is working correctly!
        </div>
        
        <p>Hello!</p>
        <p>This is a test email to verify that your CareGrid email configuration is working properly.</p>
        
        <div class="code-container">
            <p><strong>Test Verification Code:</strong></p>
            <div class="verification-code">${code}</div>
        </div>
        
        <p><strong>✅ Success!</strong> Your Gmail configuration is working and password reset emails will now be sent successfully.</p>
        
        <p>Best regards,<br>The CareGrid Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
            This is an automated test email from CareGrid. 
            If you received this unexpectedly, you can safely ignore it.
        </p>
    </body>
    </html>
    `;
}

// Run the test
console.log(`🎯 Test target: ${testEmail}`);
if (testEmail === "test@example.com") {
  console.log(
    "💡 Tip: Provide your email address as an argument to receive the test email",
  );
  console.log("   Example: node test-email-config.js your.email@gmail.com");
}
console.log("");

testEmailSending();

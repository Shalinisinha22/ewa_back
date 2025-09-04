const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
let apiInstance = new brevo.TransactionalEmailsApi();

// Set API key if available
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

/**
 * Send password reset email using Brevo
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async (toEmail, toName, resetToken, resetUrl) => {
  // If no Brevo API key is configured, use console logging as fallback
  if (!process.env.BREVO_API_KEY) {
    console.log('\n📧 PASSWORD RESET EMAIL WOULD BE SENT (Brevo not configured):');
    console.log('=====================================');
    console.log(`To: ${toName} <${toEmail}>`);
    console.log(`Subject: Password Reset Request - EWA Fashion`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log('=====================================\n');
    
    return {
      success: true,
      messageId: 'console-fallback',
      message: 'Password reset email logged to console (Brevo not configured)'
    };
  }

  try {
    // Create email data
    const emailData = {
      to: [{
        email: toEmail,
        name: toName
      }],
      templateId: parseInt(process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID) || 1,
      params: {
        NAME: toName,
        RESET_URL: resetUrl,
        RESET_TOKEN: resetToken,
        COMPANY_NAME: 'EWA Fashion',
        SUPPORT_EMAIL: 'support@ewa-fashion.com'
      },
      headers: {
        'X-Mailin-custom': 'EWA-Fashion-Password-Reset'
      }
    };

    // Send email
    const result = await apiInstance.sendTransacEmail(emailData);
    
    console.log('Password reset email sent successfully:', result);
    return {
      success: true,
      messageId: result.messageId,
      message: 'Password reset email sent successfully'
    };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    // Fallback to console logging if Brevo fails
    console.log('\n📧 PASSWORD RESET EMAIL FALLBACK (Brevo failed):');
    console.log('=====================================');
    console.log(`To: ${toName} <${toEmail}>`);
    console.log(`Subject: Password Reset Request - EWA Fashion`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log('=====================================\n');
    
    return {
      success: true,
      messageId: 'fallback',
      message: 'Password reset email logged to console (Brevo failed)'
    };
  }
};

/**
 * Send welcome email using Brevo
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} loginUrl - Login URL
 */
const sendWelcomeEmail = async (toEmail, toName, loginUrl) => {
  try {
    const emailData = {
      to: [{
        email: toEmail,
        name: toName
      }],
      templateId: parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID) || 2,
      params: {
        NAME: toName,
        LOGIN_URL: loginUrl,
        COMPANY_NAME: 'EWA Fashion',
        SUPPORT_EMAIL: 'support@ewa-fashion.com'
      },
      headers: {
        'X-Mailin-custom': 'EWA-Fashion-Welcome'
      }
    };

    const result = await apiInstance.sendTransacEmail(emailData);
    
    console.log('Welcome email sent successfully:', result);
    return {
      success: true,
      messageId: result.messageId,
      message: 'Welcome email sent successfully'
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Send simple text email (fallback if templates are not available)
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content
 * @param {string} textContent - Text content
 */
const sendSimpleEmail = async (toEmail, toName, subject, htmlContent, textContent) => {
  // If no Brevo API key is configured, use console logging as fallback
  if (!process.env.BREVO_API_KEY) {
    console.log('\n📧 EMAIL WOULD BE SENT (Brevo not configured):');
    console.log('=====================================');
    console.log(`To: ${toName} <${toEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log('Content:');
    console.log(textContent);
    console.log('=====================================\n');
    
    return {
      success: true,
      messageId: 'console-fallback',
      message: 'Email logged to console (Brevo not configured)'
    };
  }

  try {
    const emailData = {
      to: [{
        email: toEmail,
        name: toName
      }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent,
      sender: {
        name: 'EWA Fashion Admin',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@ewa-fashion.com'
      },
      headers: {
        'X-Mailin-custom': 'EWA-Fashion-Simple-Email'
      }
    };

    const result = await apiInstance.sendTransacEmail(emailData);
    
    console.log('Simple email sent successfully:', result);
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error('Error sending simple email:', error);
    
    // Fallback to console logging if Brevo fails
    console.log('\n📧 EMAIL FALLBACK (Brevo failed):');
    console.log('=====================================');
    console.log(`To: ${toName} <${toEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log('Content:');
    console.log(textContent);
    console.log('=====================================\n');
    
    return {
      success: true,
      messageId: 'fallback',
      message: 'Email logged to console (Brevo failed)'
    };
  }
};

/**
 * Generate password reset email content
 * @param {string} name - User name
 * @param {string} resetUrl - Password reset URL
 * @param {string} companyName - Company name
 */
const generatePasswordResetEmailContent = (name, resetUrl, companyName = 'EWA Fashion') => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .btn:hover { background: #0056b3; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <h2>Password Reset Request</h2>
        </div>
        
        <div class="content">
          <p>Hello ${name},</p>
          
          <p>We received a request to reset your password for your ${companyName} admin account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset My Password</a>
          </p>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          
          <div class="warning">
            <strong>Important:</strong>
            <ul>
              <li>This link will expire in 10 minutes</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>For security reasons, this link can only be used once</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>
          The ${companyName} Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from ${companyName}. If you didn't request this, please ignore it.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset Request - ${companyName}
    
    Hello ${name},
    
    We received a request to reset your password for your ${companyName} admin account.
    
    To reset your password, please visit the following link:
    ${resetUrl}
    
    Important:
    - This link will expire in 10 minutes
    - If you didn't request this password reset, please ignore this email
    - For security reasons, this link can only be used once
    
    If you have any questions, please contact our support team.
    
    Best regards,
    The ${companyName} Team
    
    ---
    This email was sent from ${companyName}. If you didn't request this, please ignore it.
    © ${new Date().getFullYear()} ${companyName}. All rights reserved.
  `;

  return { htmlContent, textContent };
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSimpleEmail,
  generatePasswordResetEmailContent
};

const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message (plain text)
 * @param {string} [options.html] - Email message (HTML format)
 * @returns {Promise<void>}
 */
exports.sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail: "less secure app" option
  });

  // 2) Define the email options
  const mailOptions = {
    from: `Spotly Support <${process.env.EMAIL_FROM || 'support@spotly.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

/**
 * Create a password reset email with text and HTML versions
 * @param {Object} user - User object
 * @param {string} resetURL - Password reset URL
 * @returns {Object} Email content with text and HTML versions
 */
exports.createPasswordResetEmail = (user, resetURL) => {
  const text = `Hi ${user.first_name},\n\nForgot your password? Click the link below to reset it:\n${resetURL}\n\nIf you didn't request a password reset, please ignore this email.\n\nRegards,\nThe Spotly Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a90e2;">Password Reset Request</h2>
      <p>Hi ${user.first_name},</p>
      <p>Forgot your password? Click the button below to reset it:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${resetURL}" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetURL}</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p>Regards,<br>The Spotly Team</p>
    </div>
  `;

  return { text, html };
};

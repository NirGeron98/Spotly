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
const sendEmail = async (options) => {
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
 * Create a password reset email with both text and HTML versions
 * @param {string} name - User's name
 * @param {string} resetURL - Password reset URL
 * @returns {Object} - Object containing text and HTML versions of the email
 */
const createPasswordResetEmail = (name, resetURL) => {
  const text = `שלום ${name},\n\n
לחץ על הקישור הבא כדי לאפס את הסיסמה שלך: ${resetURL}\n\n
הקישור יהיה בתוקף למשך 10 דקות בלבד.\n\n
אם לא ביקשת לאפס את הסיסמה, אנא התעלם מהודעה זו.\n\n
בברכה,\n
צוות Spotly`;

  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2 style="color: #3b82f6;">איפוס סיסמה</h2>
      <p>שלום ${name},</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה בחשבונך.</p>
      <p>לחץ על הכפתור למטה כדי לאפס את הסיסמה:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">איפוס סיסמה</a>
      </div>
      <p>או העתק את הקישור הבא לדפדפן שלך:</p>
      <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
        ${resetURL}
      </p>
      <p><strong>הקישור יהיה בתוקף למשך 10 דקות בלבד.</strong></p>
      <p>אם לא ביקשת לאפס את הסיסמה, אנא התעלם מהודעה זו.</p>
      <p>בברכה,<br>צוות Spotly</p>
    </div>
  `;

  return { text, html };
};

module.exports = { sendEmail, createPasswordResetEmail };

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const useMock = process.env.USE_EMAIL_MOCK === 'true' || !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

if (!useMock) {
  try {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS upgrade after connect
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });

    transporter.verify((err, success) => {
      if (err) {
        logger.error(`Email transporter verification failed: ${err.message}`);
      } else {
        logger.info('Email transporter verified successfully');
      }
    });
  } catch (err) {
    logger.error('Failed to initialize email transporter: %O', err);
    transporter = null;
  }
}

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
  if (useMock || !transporter) {
    logger.info(`[Email Simulation] To: ${to} | Subject: ${subject}`);
    logger.debug(`[Email Body] ${html}`);
    return { messageId: 'mock-id-' + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Nodemailer failed to send email: %O', error);
    throw error;
  }
};

/**
 * Generate OTP template
 */
const getOTPTemplate = (otp, name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4A90E2; text-align: center;">BTSC Mock Exam OTP Verification</h2>
      <p>Hello ${name || 'User'},</p>
      <p>Thank you for registering on our competitive exams mock platform. Use the following OTP to verify your account or complete your request. This OTP is valid for 10 minutes.</p>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
        ${otp}
      </div>
      <p>If you didn't request this code, please ignore this email.</p>
      <br>
      <p>Regards,<br>Support Team</p>
    </div>
  `;
};

/**
 * Generate Exam Report template
 */
const getResultTemplate = (name, testTitle, score, totalMarks, accuracy) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2ECC71; text-align: center;">Exam Performance Report</h2>
      <p>Hello ${name},</p>
      <p>Congratulations on completing the mock test: <strong>${testTitle}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f9f9f9;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Metric</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Value</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Score Obtained</td>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${score} / ${totalMarks}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Accuracy Rate</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${accuracy}%</td>
        </tr>
      </table>
      <p>Log in to your student dashboard to review detailed topic-wise statistics and AI-generated study recommendations.</p>
      <br>
      <p>Regards,<br>StudyNexus Exam Team</p>
    </div>
  `;
};

module.exports = {
  sendEmail,
  getOTPTemplate,
  getResultTemplate
};

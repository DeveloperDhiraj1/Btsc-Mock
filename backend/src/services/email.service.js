const { google } = require('googleapis');
const logger = require('../utils/logger');

let oAuth2Client = null;

const useMock = process.env.USE_EMAIL_MOCK === 'true'
  || !process.env.EMAIL_USER
  || !process.env.GOOGLE_CLIENT_ID
  || !process.env.GOOGLE_CLIENT_SECRET
  || !process.env.GOOGLE_REFRESH_TOKEN;

if (!useMock) {
  try {
    oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    oAuth2Client.getAccessToken()
      .then(() => logger.info('Gmail API OAuth2 client verified successfully'))
      .catch((err) => logger.error(`Gmail API OAuth2 verification failed: ${err.message}`));
  } catch (err) {
    logger.error(`Failed to initialize Gmail OAuth2 client: ${err.message}`);
    oAuth2Client = null;
  }
}

const encodeRawMessage = (from, to, subject, html) => {
  const subjectEncoded = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html
  ];
  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendEmail = async (to, subject, html) => {
  if (useMock || !oAuth2Client) {
    logger.info(`[Email Simulation] To: ${to} | Subject: ${subject}`);
    logger.debug(`[Email Body] ${html}`);
    return { messageId: 'mock-id-' + Date.now() };
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const raw = encodeRawMessage(from, to, subject, html);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    logger.info(`Email sent successfully: ${result.data.id}`);
    return { messageId: result.data.id };
  } catch (error) {
    logger.error(`Gmail API failed to send email: ${error.message}`);
    throw error;
  }
};

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

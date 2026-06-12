const { Resend } = require('resend');
const logger = require('../utils/logger');
const { isValidEmail } = require('../utils/otpGenerator');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'StudyNexus BTSC Mock';

if (!RESEND_API_KEY) {
  logger.error('[email.service] RESEND_API_KEY is not set. Email delivery will fail.');
}
if (!EMAIL_FROM) {
  logger.error('[email.service] EMAIL_FROM is not set. Email delivery will fail.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const buildFrom = () => `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`;

const sendEmail = async (to, subject, html, text) => {
  if (!resend) {
    throw new Error('Email service not configured: missing RESEND_API_KEY');
  }
  if (!EMAIL_FROM) {
    throw new Error('Email service not configured: missing EMAIL_FROM');
  }
  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email: ${to}`);
  }
  if (!subject || !html) {
    throw new Error('Email subject and html body are required');
  }

  const payload = {
    from: buildFrom(),
    to: [to.trim()],
    subject,
    html,
    text: text || stripHtml(html)
  };

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    logger.error(`[email.service] Resend send failed to=${to} subject="${subject}" reason=${error.message || JSON.stringify(error)}`);
    const err = new Error(error.message || 'Resend API error');
    err.cause = error;
    throw err;
  }

  logger.info(`[email.service] Email sent to=${to} subject="${subject}" id=${data?.id}`);
  return { messageId: data?.id };
};

const stripHtml = (html) =>
  String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const baseLayout = ({ title, previewText, contentHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a202c; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
    table { border-collapse: collapse; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; }
    .card { background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; }
    .header { background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 15px; color: #2d3748; }
    .otp-box { background: #f7fafc; border: 1px dashed #cbd5e0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 32px; letter-spacing: 10px; font-weight: 700; color: #2b6cb0; font-family: 'Courier New', monospace; }
    .stats-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .stats-table th, .stats-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .stats-table th { background: #f7fafc; font-weight: 600; color: #4a5568; }
    .stats-table td.value { font-weight: 600; color: #1a202c; text-align: right; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #718096; }
    .muted { color: #718096; font-size: 13px; }
    @media only screen and (max-width: 480px) {
      .content { padding: 24px 16px; }
      .otp-code { font-size: 26px; letter-spacing: 6px; }
      .stats-table th, .stats-table td { padding: 10px 12px; }
    }
  </style>
</head>
<body>
  <span class="preheader">${escapeHtml(previewText || '')}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td class="card">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td class="footer">
              &copy; ${new Date().getFullYear()} ${escapeHtml(EMAIL_FROM_NAME)}. All rights reserved.<br>
              You received this email because you have an account on our platform.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getOTPTemplate = (otp, name, purpose = 'verify your account') => {
  const safeName = escapeHtml(name || 'there');
  const safeOtp = escapeHtml(otp);
  const safePurpose = escapeHtml(purpose);

  const content = `
    <div class="header">
      <h1>Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hi ${safeName},</p>
      <p>Use the one-time password (OTP) below to ${safePurpose}. This code is valid for <strong>10 minutes</strong>.</p>
      <div class="otp-box">
        <div class="otp-code">${safeOtp}</div>
      </div>
      <p class="muted">If you didn't request this code, please ignore this email — your account remains secure.</p>
      <p>Regards,<br><strong>${escapeHtml(EMAIL_FROM_NAME)} Team</strong></p>
    </div>
  `;

  return baseLayout({
    title: 'Verify Your Email',
    previewText: `Your verification code is ${safeOtp}`,
    contentHtml: content
  });
};

const getResultTemplate = (name, testTitle, score, totalMarks, accuracy) => {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(testTitle);
  const safeScore = escapeHtml(score);
  const safeMarks = escapeHtml(totalMarks);
  const safeAccuracy = escapeHtml(accuracy);
  const percent = totalMarks > 0 ? Math.round((Number(score) / Number(totalMarks)) * 100) : 0;

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);">
      <h1>Your Exam Report</h1>
    </div>
    <div class="content">
      <p>Hi ${safeName},</p>
      <p>You've completed <strong>${safeTitle}</strong>. Here's a summary of your performance:</p>

      <table class="stats-table" role="presentation">
        <tr>
          <th>Score Obtained</th>
          <td class="value">${safeScore} / ${safeMarks}</td>
        </tr>
        <tr>
          <th>Percentage</th>
          <td class="value">${percent}%</td>
        </tr>
        <tr>
          <th>Accuracy</th>
          <td class="value">${safeAccuracy}%</td>
        </tr>
      </table>

      <p>Log in to your student dashboard for a detailed breakdown — topic-wise stats, time analysis, and AI-generated study recommendations.</p>
      <p>Keep going — every mock test brings you closer to your goal.</p>
      <p>Regards,<br><strong>${escapeHtml(EMAIL_FROM_NAME)} Team</strong></p>
    </div>
  `;

  return baseLayout({
    title: 'Your Exam Report',
    previewText: `You scored ${safeScore}/${safeMarks} on ${safeTitle}`,
    contentHtml: content
  });
};

module.exports = {
  sendEmail,
  getOTPTemplate,
  getResultTemplate
};

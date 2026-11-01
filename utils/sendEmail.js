const nodemailer = require("nodemailer");
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 2525;

console.log("SMTP config:", smtpHost || "not set", smtpPort);
if (!process.env.SMTP_HOST) console.error("SMTP_HOST is not set");

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    })
  : null;

module.exports = async ({ email, subject, message, attachments = [] }) => {
  if (!smtpHost) return;
  if (!email) {
    console.error("Email recipient is not set");
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    text: message,
    attachments,
  });
};

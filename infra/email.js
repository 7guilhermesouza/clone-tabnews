import nodemailer from "nodemailer";
import retry from "async-retry";

export const HTTP_EMAIL_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    password: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

async function send(mailOptions) {
  await transporter.sendMail(mailOptions);
}

async function emailServerIsReady() {
  async function fetchToEmailserver() {
    const response = await fetch(`${HTTP_EMAIL_URL}/messages`);

    if (response.status !== 200) {
      throw Error();
    } else {
      return true;
    }
  }
  return retry(fetchToEmailserver, {
    retries: 100,
    maxTimeout: 1000,
    minTimeout: 100,
  });
}

const email = {
  send,
  emailServerIsReady,
};

export default email;

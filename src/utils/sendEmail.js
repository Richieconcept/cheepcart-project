import Brevo from "@getbrevo/brevo";

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const client = new Brevo.TransactionalEmailsApi();

  client.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  const email = new Brevo.SendSmtpEmail();

  email.sender = {
    name: "CheepCart",
    email: process.env.EMAIL_FROM
  };

  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = html;

  if (attachments.length > 0) {
    email.attachment = attachments.map((attachment) => ({
      name: attachment.name,
      content: Buffer.isBuffer(attachment.content)
        ? attachment.content.toString("base64")
        : attachment.content,
    }));
  }

  try {
    const response = await client.sendTransacEmail(email);
    console.log("Email sent:", response);
  } catch (error) {
    console.error("Brevo error:", error.response?.body || error.message);
    throw error;
  }
};

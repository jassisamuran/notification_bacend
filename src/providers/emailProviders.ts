import nodemailer from "nodemailer";
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const transport = nodemailer.createTransport({});

  await transport.sendEmail({
    from: " my@app.gmail.com",
    to,
    subject,
    html: body,
  });
}

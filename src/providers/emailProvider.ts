import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { config } from "../config";
import handlebars, { template } from "handlebars";
import { EmailLogMessages } from "../../utils/constants";

const transporter = nodemailer.createTransport({
  host: config.emial.host,
  port: config.emial.port,
  secure: config.emial.secure,
  auth: {
    user: config.emial.auth.user,
    pass: config.emial.auth.pass,
  },
});

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

async function getTemplate(
  templateName: string
): Promise<HandlebarsTemplateDelegate> {
  if (templateCache.has(templateName)) {
    // Non-null assertion since we know it exists
    return templateCache.get(templateName)!;
  }

  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      `${templateName}.html`
    );
    console.log("template path ", templatePath);
    const templateSource = await fs.readFile(templatePath, "utf-8");
    const template = handlebars.compile(templateSource);

    templateCache.set(templateName, template);
    return template;
  } catch (error) {
    console.log(`Failed to load template ${templateName}: ${error}`);
    return handlebars.compile(`{{body}}`);
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  templateName?: string,
  variables?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    let html = body;
    if (templateName) {
      const template = await getTemplate(templateName);
      html = template({ ...variables, body });
    }
    const result = await transporter.sendMail({
      from: config.emial.from,
      to,
      subject,
      text: body,
      html,
    });
    console.log(EmailLogMessages.success(to, result.messageId));
    return { success: true };
  } catch (error) {
    console.log(EmailLogMessages.failed(to, error));
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import * as path from 'path';
import { promises as fs } from 'fs';
import Handlebars from 'handlebars';

type SendTemplateEmailInput = {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  replyTo?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly templatesDir: string;

  // Cache de templates compilados
  private readonly templateCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');

    const portRaw = this.configService.get<string>('SMTP_PORT');
    const port = portRaw ? Number(portRaw) : 2525;

    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    const secureRaw = this.configService.get<string>('SMTP_SECURE') ?? 'false';
    const secure = secureRaw === 'true' || secureRaw === '1';

    this.from =
      this.configService.get<string>('MAIL_FROM')?.trim() ||
      'No Reply <no-reply@local.test>';

    // templates
    this.templatesDir = path.join(__dirname, 'templates');

    if (!host || !port || Number.isNaN(port) || !user || !pass) {
      throw new Error(
        'SMTP configuration missing/invalid. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    let compiled = this.templateCache.get(templateName);

    if (!compiled) {
      const filePath = path.join(this.templatesDir, `${templateName}.hbs`);

      let source: string;
      try {
        source = await fs.readFile(filePath, 'utf8');
      } catch {
        throw new Error(
          `Email template not found: ${templateName}.hbs (path: ${filePath})`,
        );
      }

      compiled = Handlebars.compile(source, { strict: true });
      this.templateCache.set(templateName, compiled);
    }

    return compiled(context);
  }

  async sendTemplateEmail(input: SendTemplateEmailInput): Promise<string> {
    const { to, subject, template, context, replyTo } = input;

    const html = await this.renderTemplate(template, context);

    try {
      const info: unknown = (await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        replyTo,
      })) as unknown;

      let messageId = '(no-message-id)';

      if (
        typeof info === 'object' &&
        info !== null &&
        'messageId' in info &&
        typeof (info as { messageId?: unknown }).messageId === 'string'
      ) {
        messageId = (info as { messageId: string }).messageId;
      }

      this.logger.log(
        `Email sent -> to=${to} template=${template} id=${messageId}`,
      );
      return messageId;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Email failed -> to=${to} template=${template} error=${errMsg}`,
      );
      throw error;
    }
  }
}

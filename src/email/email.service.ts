import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { VaultConfigService } from '../vault-config/vault-config.service';
import { MinioService } from '../minio/minio.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter;

    constructor(
    private readonly configService: VaultConfigService,
    private readonly minioService: MinioService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_PASS'),
      },
    });
  }

    async sendMail(to: string, subject: string, mjmlContent: string) {
    this.logger.log(`Processing email for: ${to} | Subject: "${subject}"`);
            let updatedMjmlContent = mjmlContent;
    const attachments = [];
    const imagePaths = mjmlContent.match(/src="\.\.\/assets\/([^\"]+)"/g) || [];

    this.logger.log(`Found ${imagePaths.length} local images to embed.`);

    for (const imgPath of imagePaths) {
      const relativePath = imgPath.substring(5, imgPath.length - 1);
      const fileName = path.basename(relativePath);
            const absolutePath = path.resolve(process.cwd(), 'src', 'assets', fileName);
      const cid = `${fileName}@waangu.eu`; // Create a unique CID

      if (fs.existsSync(absolutePath)) {
        attachments.push({
          filename: fileName,
          path: absolutePath,
          cid: cid,
        });
        updatedMjmlContent = updatedMjmlContent.replace(relativePath, `cid:${cid}`);
        this.logger.log(`Embedding ${fileName} with CID: ${cid}`);
      } else {
        this.logger.warn(`Image file not found at path: ${absolutePath}`);
      }
    }

    const { html } = mjml2html(updatedMjmlContent);

    await this.transporter.sendMail({
      from: `"Waangu Events" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject,
      html,
      attachments,
    });

    this.logger.log(`Email successfully sent to: ${to}`);
  }
}

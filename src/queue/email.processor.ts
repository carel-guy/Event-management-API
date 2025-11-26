import { VaultConfigService } from 'src/vault-config/vault-config.service';
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bull';
import { Model, Types } from 'mongoose';
import { EmailService } from '../email/email.service';
import {
  EventSchedule,
  EventScheduleDocument,
} from '../event-schedule/entities/event-schedule.entity';
import { SpeakerService } from '../speaker/speaker.service';
import * as fs from 'fs';
import * as path from 'path';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  constructor(
    private readonly emailService: EmailService,
    private readonly speakerService: SpeakerService,
    @InjectModel(EventSchedule.name)
    private eventScheduleModel: Model<EventScheduleDocument>,
    private readonly coreConfigService: VaultConfigService,
  ) {}

  @Process('speaker-notification')
    async handleSpeakerNotification(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    try {
    const { speakerId, review, tenantId } = job.data;
        const speaker = await this.speakerService.findOne(
      new Types.ObjectId(tenantId),
      new Types.ObjectId(speakerId),
    );

    if (speaker && speaker.email) {
      const eventSchedule = await this.eventScheduleModel
        .findById(review.eventScheduleId)
        .exec();
      const sessionTitle = eventSchedule ? eventSchedule.title : 'the event';

      const templatePath = path.join(
        __dirname,
        '..',
        'email',
        'templates',
        'speaker-notification.mjml',
      );
            const host = this.coreConfigService.get<string>('APP_HOST');
      const port = this.coreConfigService.get<number>('APP_PORT');
      const baseUrl = `http://${host}:${port}`;

      let mjmlContent = fs.readFileSync(templatePath, 'utf8');

      mjmlContent = mjmlContent.replace(/{{baseUrl}}/g, baseUrl);

      mjmlContent = mjmlContent.replace('{{speakerName}}', speaker.name);
      mjmlContent = mjmlContent.replace('{{sessionTitle}}', sessionTitle);
      mjmlContent = mjmlContent.replace(
        '{{reviewerName}}',
        review.registrationName,
      );
      mjmlContent = mjmlContent.replace('{{comment}}', review.comment);

      await this.emailService.sendMail(
        speaker.email,
        'You have been tagged in a review',
        mjmlContent,
      );
      this.logger.log(`Successfully processed job ${job.id}: Email sent to ${speaker.email}`);
    } else {
      this.logger.warn(`Job ${job.id} skipped: Speaker ${speakerId} not found or has no email.`);
    }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed with error: ${error.message}`, error.stack);
      throw error; // Re-throw the error to let BullMQ handle the job failure (e.g., retry or move to failed queue)
    }
  }
}

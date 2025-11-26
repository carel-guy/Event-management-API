import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async addEmailJob(jobName: string, data: any) {
    await this.emailQueue.add(jobName, data);
  }
}

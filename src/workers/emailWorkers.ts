import { emailQueue } from "../queues/notificationQueue";
import { sleep } from "../../utils/helper";
export class EmailWorker {
  private running: boolean = false;
  private workerId: string;
  constructor(workerId: string = "1") {
    this.workerId = `email-worker-${workerId}`;
  }
  async start() {
    this.running = true;
    console.log(`Starting ${this.workerId}`);
    while (this.running) {
      try {
        const item = await emailQueue.dequeue();
        if (!item) {
          await sleep(1000);
          continue;
        }
        console.log(`${this.workerId} processing email to: ${item.payload.to}`);

        // const result = await sendEmail();
      } catch (error) {}
    }
  }
}

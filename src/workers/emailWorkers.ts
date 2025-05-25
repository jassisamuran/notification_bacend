import { emailQueue } from "../queues/notificationQueue";
import { sleep } from "../../utils/helper";
import { sendEmail } from "../providers/emailProviders";
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

        const result = await sendEmail({
          to: item.payload.to,
          subject: item.payload.subject,
          body: item.payload.body,
        });
        // if (result) {
        // what will happen after this is it passed or not ;
        await emailQueue.complete(item.id);

        // }
        // else{
        // const backoff=Math.pow(5,item.retryCount+1);
        // await emailQueue.retry(item,backoff).
        // }
      } catch (error) {
        console.log(`${this.workerId} encounter  an error : ${error}`);
        await sleep(5000);
      }
    }
  }
  stop() {
    console.log(`stopping ${this.workerId}`);
    this.running = false;
  }
}

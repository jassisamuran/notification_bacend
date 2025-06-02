import { emailQueue } from "../queues/notificationQueue";
import { sleep } from "../../utils/helper";
import { fakeEmailProvider } from "../providers/fakeEmailProvider";
import Notification from "../../models/notificationSchema";

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
        // console.log(`${this.workerId} dequeued item: ${item?.id}`);
        if (!item) {
          await sleep(1000);
          continue;
        }
        await Notification.updateOne(
          { email: `${item.payload.from}` },
          { status: "processing" }
        );

        console.log(`${this.workerId} processing email to: ${item.payload.to}`);

        const result = await fakeEmailProvider("email", item.payload);
        if (result.success) {
          await emailQueue.complete(item.id);
          await Notification.updateOne(
            { email: `${item.payload.from}` },
            { status: "completed" }
          );
          console.info(
            `${this.workerId} successfully send sms to ${item.payload.to}`
          );
        } else {
          console.warn(
            `${this.workerId} failed to send email: to ${result.error}`
          );
          await Notification.updateOne(
            { email: `${item.payload.from}` },
            { status: "failed" }
          );
          await emailQueue.retry(item, 60);
        }
      } catch (error) {
        console.log(`${this.workerId} encountered an error : ${error}`);
        await sleep(5000);
      }
    }
  }
  stop() {
    console.log(`stopping ${this.workerId}`);
    this.running = false;
  }
}

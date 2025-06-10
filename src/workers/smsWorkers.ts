import { smsQueue } from "../queues/notificationQueue";
import { sleep } from "../../utils/helper";
import { sendSms } from "../providers/smsProvider";
import { fakeSmsProvider } from "../providers/fakeSmsProvider";
import Notification from "../../models/notificationSchema";

export class smsWorker {
  private running: boolean = false;
  private workerId: string;

  constructor(workerId: string = "1") {
    this.workerId = `sms-worker-${workerId}`;
  }
  async start() {
    this.running = true;
    console.log(`Starting ${this.workerId}`);

    while (this.running) {
      try {
        const item = await smsQueue.dequeue();
        if (!item) {
          await sleep(1000);
          continue;
        }
        await Notification.updateOne(
          { email: `${item.payload.from}` },
          { status: "processing" }
        );
        console.info(
          `${this.workerId} processing  SMS to : ${item.payload.to}`
        );
        const result = await fakeSmsProvider("sms", item.payload);
        if (result.success) {
          await smsQueue.complete(item.id);
          await Notification.updateOne(
            { email: `${item.payload.from}` },
            { status: "completed" }
          );

          console.info(
            `${this.workerId} successfully send sms to ${item.payload.to}`
          );
        } else {
          console.warn(
            `${this.workerId} failed to send sms: to ${result.error}`
          );
          await Notification.updateOne(
            { email: `${item.payload.from}` },
            { status: "failed" }
          );
          await smsQueue.retry(item, 10);
        }
      } catch (error) {
        console.error(`${this.workerId} encountered an error: ${error}`);
        await sleep(5000);
      }
    }
  }
  stop() {
    console.info(`Stopping ${this.workerId}`);
    this.running = false;
  }
}

import { smsQueue } from "../queues/notificationQueue";
import { sleep } from "../../utils/helper";
import { sendSms } from "../providers/smsProvider";

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
        console.info(
          `${this.workerId} processing  SMS to : ${item.payload.to}`
        );
        console.info("item data", item.payload.to);
        console.log("check here", item.payload);
        const result = await sendSms(item.payload.to, item.payload.text);
        if (result.success) {
          await smsQueue.complete(item.id);
          console.info(
            `${this.workerId} successfully send sms to ${item.payload.to}`
          );
        } else {
          console.warn(
            `${this.workerId} failed to send sms: to ${result.error}`
          );

          const backoff = Math.pow(5, item.retryCount + 1);
          await smsQueue.enqueue(item, backoff);
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

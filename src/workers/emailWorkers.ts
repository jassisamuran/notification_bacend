import { emailQueue } from "../queues/notificationQueue";
import { sleep } from "../../utils/helper";
import { fakeEmailProvider } from "../providers/fakeEmailProvider";

import Notification from "../../models/notificationSchema";
import { getSocketIO } from "../../io";
import NotificationMetricsService from "../services/NotificationMetricsService";
let count = 0;
export class EmailWorker {
  private running: boolean = false;
  private workerId: string;
  private metricsService: NotificationMetricsService;
  constructor(workerId: string = "1") {
    this.workerId = `email-worker-${workerId}`;
    this.metricsService = new NotificationMetricsService();
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

        const result = await fakeEmailProvider("email", item.payload);
        if (result.success) {
          await emailQueue.complete(item.id);
          console.info(
            `${this.workerId} successfully send sms to ${item.payload.to}`
          );

          const d = await this.metricsService.increamentSuccess("email");
          // const metrics = await this.metricsService.getMetricsByType("email");

          count++;
          // io.emit("count", count);
          console.log("hfsi");
          process.send?.({
            type: "socket_emit",
            data: { event: "count", value: count },
            // next file
          });
          process.send?.({
            type: "socket_emit",
            data: { event: "success", value: d.message },
          });
        } else {
          console.warn(
            `${this.workerId} failed to send sms: to ${result.error}`
          );
          await emailQueue.retry(item, 60);
        }
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

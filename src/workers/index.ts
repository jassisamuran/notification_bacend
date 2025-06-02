import { EmailWorker } from "./emailWorkers";
import { smsWorker } from "./smsWorkers";
import cluster from "cluster";
import os from "os";

const calculateWorkerCount = () => {
  const cpucnt = os.cpus().length;
  return {
    emailWorkers: Math.max(1, Math.floor(cpucnt * 0)),
    smsWorkers: Math.max(1, Math.floor(cpucnt * 0.1)),
  };
};

export function startWorkers() {
  if (cluster.isPrimary) {
    const counts = calculateWorkerCount();
    console.log(`starting workers clusters ${JSON.stringify(counts)}`);

    for (let i = 0; i < counts.emailWorkers; i++) {
      const worker = cluster.fork({
        WORKER_TYPE: "email",
        WORKER_ID: i.toString(),
      });
      console.info(`Started email worker ${i} with PID  ${worker.process.pid}`);
    }
    // for (let i = 0; i < counts.smsWorkers; i++) {
    //   const woker = cluster.fork({
    //     WORKER_TYPE: "sms",
    //     WORKER_ID: i.toString(),
    //   });
    //   console.info(`Started sms worker ${i} with PID ${woker.process.pid}`);
    // }

    cluster.on("exit", (worker, code, signal) => {
      console.log(
        `Worker ${worker.process.pid}  died with code ${code} and signal ${signal}`
      );
      console.log("Starting a replacement worker");
    });
    cluster.on("listening", () => {
      console.log("cluster is running ");
    });
  } else {
    // worker process
    const workerType = process.env.WORKER_TYPE;
    const workerId = process.env.WORKER_ID || "0";
    if (workerType == "email") {
      const worker = new EmailWorker(workerId);
      worker.start().catch((err) => {
        console.error(`Email worker ${workerId} failed to restart ${err}`);
        process.exit(1);
      });
    }
    // else
    // if (workerType == "sms") {
    //   const worker = new smsWorker(workerId);
    //   worker.start().catch((err) => {
    //     console.error(`Sms worker ${workerId} failed to restart ${err}`);
    //     process.exit(1);
    //   });
    // }
    else {
      console.error(`Unknown worker type : ${workerType}`);
      process.exit(1);
    }
  }
}

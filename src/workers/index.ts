import { EmailWorker } from "./emailWorkers";
import cluster from "cluster";
import os from "os";

const calculateWorkerCount = () => {
  const cpucnt = os.cpus().length;
  return {
    emailWorkers: Math.max(1, Math.floor(cpucnt * 0.4)),
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
      console.log(`Started email worker ${i} with PID  ${worker.process.pid}`);
    }

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
      });
    } else {
      console.error(`Unknown worker type : ${workerType}`);
      process.exit(1);
    }
  }
}

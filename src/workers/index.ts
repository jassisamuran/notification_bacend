// src/workers/index.ts
import { EmailWorker } from "./emailWorkers";
import { smsWorker } from "./smsWorkers";
import cluster from "cluster";
import os from "os";
import { getSocketIO } from "../../io";
const calculateWorkerCount = () => {
  const cpucnt = os.cpus().length;
  return {
    emailWorkers: Math.max(1, Math.floor(cpucnt * 0.2)),
    smsWorkers: Math.max(1, Math.floor(cpucnt * 0.1)),
  };
};

export function startWorkers() {
  if (cluster.isPrimary) {
    // In server.ts (inside cluster.isPrimary block)
    cluster.on("message", (worker, message: any) => {
      console.log("check11", message);
      if (message.type === "socket_emit") {
        const io = getSocketIO();
        io?.emit(message.data.event, message.data.value);
        console.log(")))))))");
      }
      // next file
    });

    const counts = calculateWorkerCount();
    console.log(`🧠 Starting worker clusters: ${JSON.stringify(counts)}`);

    // Spawn email workers
    for (let i = 0; i < counts.emailWorkers; i++) {
      const worker = cluster.fork({
        WORKER_TYPE: "email",
        WORKER_ID: i.toString(),
      });
      console.info(`📧 Started email worker ${i} (PID: ${worker.process.pid})`);
    }

    // Spawn SMS workers
    for (let i = 0; i < counts.smsWorkers; i++) {
      const worker = cluster.fork({
        WORKER_TYPE: "sms",
        WORKER_ID: i.toString(),
      });
      console.info(`📨 Started sms worker ${i} (PID: ${worker.process.pid})`);
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(
        `❌ Worker ${worker.process.pid} died with code ${code} and signal ${signal}`
      );
      // Optional: restart logic can go here
    });
  } else {
    const workerType = process.env.WORKER_TYPE;
    const workerId = process.env.WORKER_ID || "0";

    if (workerType === "email") {
      const worker = new EmailWorker(workerId);
      worker.start().catch((err) => {
        console.error(`💥 Email worker ${workerId} failed:`, err);
        process.exit(1);
      });
    } else if (workerType === "sms") {
      const worker = new smsWorker(workerId);
      worker.start().catch((err) => {
        console.error(`💥 SMS worker ${workerId} failed:`, err);
        process.exit(1);
      });
    } else {
      console.error(`⚠️ Unknown WORKER_TYPE: ${workerType}`);
      process.exit(1);
    }
  }
}
startWorkers();

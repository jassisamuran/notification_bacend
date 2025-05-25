import { startOtpConsumer } from "./otpConsumer";
import { startEmailConsumer } from "./emailConsumer";
import { startSmsConsumer } from "./smsConsumer";

async function startAllConsumers() {
  const d = await Promise.all([
    startEmailConsumer,
    startOtpConsumer,
    startSmsConsumer,
  ]);
  console.log("consumer ", d);
  console.log("all kafka consuemrs are started ");
}
startAllConsumers();
export default startAllConsumers;

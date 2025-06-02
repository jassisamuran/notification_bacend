import kafka from "./kafka";
type MessageHandler = (message: any) => Promise<void>;
type MessageFilter = (message: any) => boolean;
export const createKafkaConsumer = async (
  groupId: string,
  filterFn: MessageFilter,
  processFn: MessageHandler
) => {
  const consumer = kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });
  await consumer.connect();
  await consumer.subscribe({ topic: "notification", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }: { message: { value: Buffer | null } }) => {
      try {
        if (!message.value) {
          console.log(`Empty message received in ${groupId}, skipping`);
          return;
        }

        // Parse the message value
        const parsedMessage: any = JSON.parse(message.value.toString());

        // Apply the filter
        if (filterFn(parsedMessage)) {
          // console.log(`Message matched filter for ${groupId}:`, parsedMessage);
          await processFn(parsedMessage);
        } else {
          // console.log(`Message did not match filter for ${groupId}, skipping`);
        }
      } catch (error) {
        // console.error(`Error processing message in ${groupId}:`, error);
      }
    },
  });
};

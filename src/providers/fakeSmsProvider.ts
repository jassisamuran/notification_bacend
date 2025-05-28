interface SmsPayload {
  to: string;
  text: string;
}

type SmsType = string;

export async function fakeSmsProvider(
  type: SmsType,
  payload: SmsPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await new Promise<{ success: boolean }>(
      (resolve, reject) => {
        const delay = Math.floor(Math.random() * 1000); // simulate 0-1s delay

        setTimeout(() => {
          const shouldFail = Math.random() < 0.1;

          if (shouldFail) {
            console.error(
              `[FAILURE] ${type.toUpperCase()} to ${payload.to}: ${
                payload.text
              }`
            );
            reject({ success: false });
          } else {
            console.log(
              `[SENT] ${type.toUpperCase()} to ${payload.to}: ${payload.text}`
            );
            resolve({ success: true });
          }
        }, delay);
      }
    );
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

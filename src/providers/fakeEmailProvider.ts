function fakeEmailProvider(type, payload) {
  return new Promise((resolve, reject) => {
    const delay = Math.floor(Math.random() * 1000); // simulate 0-1s delay

    setTimeout(() => {
      const shouldFail = Math.random() < 0.1; // 10% failure rate

      if (shouldFail) {
        console.error(
          `[FAILURE] ${type.toUpperCase()} to ${payload.to}: ${payload.message}`
        );
        reject(new Error("Simulated failure"));
      } else {
        console.log(
          `[SENT] ${type.toUpperCase()} to ${payload.to}: ${payload.message}`
        );
        resolve({ success: true });
      }
    }, delay);
  });
}

module.exports = fakeSmsProvider;

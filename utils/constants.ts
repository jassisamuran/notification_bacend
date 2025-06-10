export const CONNECTED_TO_MONGODB = "Connected to MongoDB";
export const MONGODB_URI_NOT_DEFINED =
  "MONGODB_URI environment variable is not defined.";
export const MONGODB_CONNECTION_ERROR = "MongoDB connection error:";
export const MONGODB_DISCONNECTED = "MongoDB disconnected";
export const MONGODB_CONNECTION_SUCCESS = "MongoDB connected";

export const EmailLogMessages = {
  failed: (to: string, error: any) =>
    `Failed to send email to ${to} : ${error}`,
  success: (to: string, id: string) => `Email sent to ${to}, message id ${id}`,
};

export const MONGODB = {
  createdAndQueued: "Notification created and queued successfully",
  error: "Something Went Wrong",
};

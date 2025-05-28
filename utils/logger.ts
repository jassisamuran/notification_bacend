import { error } from "console";

const { createLogger, format, transports } = require("winston");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.printf(
      (info) =>
        `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new transports.console(),
    new transports.File({ filename: "logs/notification.log" }),
    new transports.File({ filename: "logs/errors.log", level: error }),
  ],
});

export default logger;

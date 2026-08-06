// In logger we will be using Winston
// Winston is a universal logging library with support for multiple transports.

import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => {
      return `${info.timestamp} -> [${info.level.toUpperCase()}] ${info.message}`;
    })
  ),

  transports: [
    new winston.transports.Console()
  ]
});

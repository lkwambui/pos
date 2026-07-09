import pino from 'pino';
import { config } from '../config/app';

const transport = config.app.env !== 'production'
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
  : undefined;

export const logger = pino({
  level: config.logging.level,
  transport,
  redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
});

export default logger;

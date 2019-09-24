import {SPLAT} from 'triple-beam';
import {createLogger as createWinstonLogger, format, transports} from 'winston';
const {combine, timestamp, printf, colorize} = format;

type LogMethod = (message: string, ...args: any[]) => void;

interface Logger {
  level: string;
  levels: {[s: string]: number};
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

const myFormat = printf((info) => {
  let splat = info[SPLAT];
  return `${info.timestamp} ${info.level}: ${info.message}` + (
    splat ? ' ' + splat.map(JSON.stringify).join(' ') : ''
  );
});

export default function createLogger(): Logger {
  const level = (process.env.NODE_ENV || 'development') === 'development' ? 'debug' : 'info';
  return createWinstonLogger({
    transports: [
      new transports.Console({
        level,
        handleExceptions: true,
        format: combine(
          colorize(),
          timestamp(),
          myFormat
        )
      })
    ],
    exitOnError: false
  });
}

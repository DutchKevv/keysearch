import { createLogger, format, transports } from 'winston'
import * as path from 'path'

const { combine, timestamp, label, printf, colorize, simple, errors, prettyPrint, json } = format
export const PATH_LOGS = path.join(__dirname, '../../../../_logs/')
export const PATH_LOGS_COMBINED = path.join(PATH_LOGS, 'combined.log')
export const PATH_LOGS_ERROR = path.join(PATH_LOGS, 'error.log')

const errorStackFormat = format(info => {
    if (info instanceof Error) {
      return Object.assign({}, info, {
        stack: info.stack,
        message: info.message
      })
    }
    return info
  })

export const logger = createLogger({
    level: 'info',
    format: combine(
        errorStackFormat(),
        colorize(),
        // errors({ stack: true }), // <-- use errors format
        simple(),   
        // json(),
        timestamp(),
        // prettyPrint(),
    ),
    // defaultMeta: { time: new Date() },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({ filename: PATH_LOGS_ERROR, level: 'error', maxFiles: 10, maxsize: 1000 * 1000 }),
        new transports.File({ filename: PATH_LOGS_COMBINED, maxFiles: 10, maxsize: 1000 * 1000 }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        // format: combine(
        //     errorStackFormat(),
        //     // colorize(),
        //     // errors({ stack: true }), // <-- use errors format
        //     // simple(),

        //     timestamp(),
        //     // prettyPrint(),
        // )
    }));
} else {
  
}
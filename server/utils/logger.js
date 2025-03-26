import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createLogger = (service) => {
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        defaultMeta: { service },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),
            new winston.transports.File({
                filename: path.join(__dirname, '../../logs/error.log'),
                level: 'error'
            }),
            new winston.transports.File({
                filename: path.join(__dirname, '../../logs/combined.log')
            })
        ]
    });
};
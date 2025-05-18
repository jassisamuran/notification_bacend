import winston from 'winston'
export const notificationLogger =winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports:[
        new winston.transports.File({
            filename:'logs/notification.log',
            
        }),
        new winston.transports.Console()
]

})

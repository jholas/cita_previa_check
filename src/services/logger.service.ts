import log4js, { Logger } from 'log4js';

log4js.configure('.log4js.json');

export class Log {

    private logger: Logger | null = null;

    private constructor() {
    }

    public static createLogger(name?: string) {
        const log = new Log();
        log.logger = log4js.getLogger(name);
        return log;
    }

    public debug(message: any, ...args: any[]): void {
        this.logger?.debug(message, ...args);
    }

    public info(message: any, ...args: any[]): void {
        this.logger?.info(message, ...args);
    }

    public warn(message: any, ...args: any[]): void {
        this.logger?.warn(message, ...args);
    }

    public error(message: any, ...args: any[]): void {
        this.logger?.error(message, ...args);
    }
};

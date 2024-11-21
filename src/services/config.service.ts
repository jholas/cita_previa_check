import fs from 'node:fs';
import { IConfig } from '../interfaces/config.interface';
import { Log } from './logger.service';


class ConfigService {
    private readonly log = Log.createLogger('config.service');

    private config: IConfig | null = null;

    constructor() {
    }

    public get default(): IConfig {
        if (!this.config) {
            this.config = this.readConfig();
        }
        return this.config || {} as IConfig;
    }

    private readConfig(): IConfig | null {
        let configData = null;
        try {
            configData = fs.readFileSync('./app.config.json');
        } catch (err) {
            this.log.error('Failed to read app.config.json to set up app configuration.', err);
            process.exit(1);
        }
        return configData ? JSON.parse(configData.toString()) as IConfig : null;
    }
}

export const config = new ConfigService();

import moment from 'moment';
import fs from 'node:fs';
import { Provincia } from './operation-enums';
import { Page } from 'puppeteer';
import UserAgent from 'user-agents';
import { Log } from './services/logger.service';
import { CleanupCode } from './cleanup-code.enum';

const log = Log.createLogger('utils');

export type cleanupFce = (errCode: CleanupCode, desc?: string) => Promise<void>;

export function getFormatedDateTime() {
    return moment().format('YYYY-MM-DD_HH-mm-ss');
}

export function getFormatedDate() {
    return moment().format('YYYY-MM-DD');
}

function getScreenshotName(name: string, op: string) {
    return `${getFormatedDateTime()}__${name}_${op}`;
}

export function delay(time: number) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}

export function base64_encode(file: string) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}

export function getProvinciaUrl(provincia: string) {
    const provUrl = Provincia[provincia];
    if (!provUrl) {
        log.warn('Provincia is not defined (\'' + provincia + '\')...exit');
        process.exit(1);
    }
    return provUrl;
}

export function printHelp() {
    console.log('\nTODO: help description\n');
}

async function getDayDir() {
    const newDir = `./screenshots/${getFormatedDate()}`;
    try {
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir);
        }
    } catch (err) {
        log.warn('Day folder for screenshots could not be created', err);
        return null;
    }

    return newDir;
}

export async function createScreenshot(page: Page, text: string, CITA_OP: string) {
    let dayDirPath = await getDayDir();
    if (!dayDirPath) {
        dayDirPath = './screenshots';
    }
    const screenshotPath = `${dayDirPath}/${getScreenshotName(text, CITA_OP)}.png`;

    try {
        await page.screenshot({
            path: screenshotPath
        });
    } catch (err) {
        log.error('Failed to creat screenshot.', err);
    }

    return screenshotPath;
}

export function getRandomUserAgent() {
    const userAgent = new UserAgent({deviceCategory: 'desktop'});
    return userAgent.toString();
}

export const getCitaPageUrl = (provincia: string) => 'https://icp.administracionelectronica.gob.es' + getProvinciaUrl(provincia);

export function logAppExit(exitCode: number) {
    log.debug(`App is exiting with code: ${exitCode}`);
}

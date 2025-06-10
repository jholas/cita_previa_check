import fs from 'node:fs';
import puppeteer, { Page } from 'puppeteer';
import { sendMail } from './services/mailer.service';
import {
    base64_encode,
    cleanupFce,
    createScreenshot,
    delay,
    getCitaPageUrl,
    getFormatedDateTime,
    getProvinciaUrl,
    getRandomUserAgent,
    logAppExit,
    printHelp
} from './utils';
import { sendPushNotification } from './services/mobile-notifier.service';
import { residency_eu } from './operations/residency_eu';
import { nie } from './operations/nie';
import { CitaFormData } from './models/cita-form-data.model';
import { Log } from './services/logger.service';
import { CleanupCode } from './cleanup-code.enum';
import { config } from './services/config.service';
import { parseCliArgs } from './services/cli-args-parser.service';


const log = Log.createLogger('index');
console.log(''); // add empty line
log.info('APPLICATION START with args', process.argv);

// Parse CLI arguments to application form data
let frmData: CitaFormData | null = null;
try {
    frmData = parseCliArgs();
} catch (err: Error | any) {
    log.warn('Invalid argument: ', err?.message || 'unknown error');
    printHelp();
    process.exit(1);
}

if (!frmData) {
    log.error('Form data is not defined...exit');
    process.exit(1);
}

frmData.isCitaAvailable = false;

try {
    if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots');
    }
} catch (err) {
    log.warn('folder for screenshots could not be created', err);
}

(async () => {
    // Launch the browser and open a new blank page
    /* const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--incognito'
        ],
        executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    }); */
    const browser = await puppeteer.connect({browserURL: 'http://127.0.0.1:9222'});
    const page = await browser.newPage();
    let isPageClosed = false;
    let isBrowserDisconnected = false;
    let isCleaningUp = false;

    //await page.setCacheEnabled(false);

    //await page.setUserAgent(getRandomUserAgent());
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0');

    // Set screen size
    await page.setViewport({width: 1080, height: 1150});

    const cleanup: cleanupFce = async (errCode: CleanupCode, desc?: string): Promise<void> => {
        log.debug(`cleanup: isPageClosed=${isPageClosed}, isBrowserDisconnected=${isBrowserDisconnected}`);
        if (isPageClosed && isBrowserDisconnected) {
            log.debug('cleanup: already cleaned up');
            return;
        }

        if (isCleaningUp) {
            log.debug('cleanup: already cleaning up');
            return;
        }

        isCleaningUp = true;
    
        try {
            log.debug(`cleanup: errCode=${errCode}, desc='${desc || 'no description'}'`);
            
            if (page && !isPageClosed) {
                await page.close();
                isPageClosed = true;
                log.debug('cleanup: page closed');
            }
    
            if (!isBrowserDisconnected) {
                await browser.disconnect();
                isBrowserDisconnected = true;
                log.debug('cleanup: browser disconnected');
            }
    
            logAppExit(0);
            process.exit(0);
        } catch (err) {
            log.error('cleanup failed:', err);
            logAppExit(1);
            process.exit(1);
        }
    };

    // async wait: Too many requests
    page.waitForFunction('document.querySelector("body").innerText.includes("Too Many Requests")')
        .then(async (res) => {
            if (isCleaningUp) {
                log.debug('cleanup: already cleaned up: too many requests');
                return;
            }
            frmData.isCitaAvailable = false;
            log.warn('Result: ERR: TOO MANY REQUESTS', res);
            await createScreenshot(page, 'too-many-requests', frmData.CITA_OP);
            await delay(500);
            await cleanup(CleanupCode.TOO_MANY_REQUESTS, 'err: too many requests');
        })
        .catch(async (err) => {
            if (isCleaningUp) {
                log.debug('cleanup: already cleaned up: too many requests');
                return;
            }
            log.error('exception caught in "too many requests" async handler', err);
            if (!frmData.isCitaAvailable) {
                await cleanup(CleanupCode.TOO_MANY_REQUESTS_ERR, err);
            }
        });

    // async wait: URL rejected
    page.waitForFunction('document.querySelector("body").innerText.includes("The requested URL was rejected")')
        .then(async (res) => {
            if (isCleaningUp) {
                log.debug('cleanup: already cleaned up: url rejected');
                return;
            }
            frmData.isCitaAvailable = false;
            log.warn('Result: ERR: URL REJECTED', res);
            await createScreenshot(page, 'rejected', frmData.CITA_OP);
            await delay(1000);
            await cleanup(CleanupCode.URL_REJECTED, 'err: rejected');
        })
        .catch(async (err) => {
            if (isCleaningUp) {
                log.debug('cleanup: already cleaned up: url rejected');
                return;
            }
            log.error('exception caught in "url rejected" async handler', err);
            if (!frmData.isCitaAvailable) {
                await cleanup(CleanupCode.URL_REJECTED_ERR, err);
            }
        });

    // async wait: No Citas disponible
    page.waitForFunction('document.querySelector("body").innerText.includes("no hay citas disponibles")')
        .then(async (res) => {
            if (isCleaningUp) {
                log.debug('cleanup: already cleaned up: no citas disponible');
                return;
            }
            frmData.isCitaAvailable = false;
            log.warn('Result: WARN: NO CITAS DISPONIBLE');
            await createScreenshot(page, 'no-disponible', frmData.CITA_OP);

            await cleanup(CleanupCode.NO_CITAS_DISPONIBLE, 'err: no citas disponible');
        })
        .catch(async (err) => {
            if (isCleaningUp) {
                log.debug('cleanup: already cleaned up: no citas disponible');
                return;
            }
            log.error('exception caught in "no citas disponibles" async handler ', err);
            if (!frmData.isCitaAvailable) {
                await cleanup(CleanupCode.NO_CITAS_DISPONIBLE_ERR, err);
            }
        });


    //await delay(1000);
    // Navigate the page to a URL
    //await page.goto(getCitaPageUrl(frmData.provincia));
    await page.goto('https://icp.administracionelectronica.gob.es/icpco/index.html');

    
    // 0. Select Provincia
    await delay(1000);
    await page.waitForSelector('#form');
    await page.select('#form', getProvinciaUrl(frmData.provincia));
    await delay(500);
    await page.click('#btnAceptar');





    // Load of different operation based on CITA_OP
    switch (frmData.CITA_OP) {
        // 22, 4038 => residency_eu.mjs
        case '22':
        case '4038':
            await residency_eu(page, frmData, cleanup);
            break;

        // 4039 => assignacion de NIE
        case '4031':
            await nie(page, frmData, cleanup);
            break;
    };


    // 4th PAGE: CITAS or Info about nothing available
    try {
        await page.waitForNavigation();
    } catch (err) {
        log.error('err: wait for navigation failed: 4th page: citas or info', err);
        await cleanup(CleanupCode.PAGE_4_NAVI_ERR);
    }


    await processCitaAvailable(frmData, page, cleanup);


    //Don't cleanup, instead keep the window open to finish the CITA manually
    logAppExit(0);
    process.exit(0);
})();

async function processCitaAvailable(frmData: CitaFormData, page: Page, cleanup: cleanupFce): Promise<void> {
    frmData.isCitaAvailable = true;

    await delay(700);
    await page.waitForSelector('#idSede > option');
    const opts = await page.$$eval('#idSede > option', (opt) => {
        return new Promise<{text: string | null, value: string}[]>((resolve) => {
            const resVal = opt.map((opt) => {
                return {
                    text: opt.textContent,
                    value: opt.value
                };
            });
            resolve(resVal);
        });
    });

    const optsTexts = opts
        .map(o => o.text)
        .filter(t => t && !t.startsWith('Seleccionar'));
    const citasCount = optsTexts.length;
    const citaPlaces = `citas ${citasCount}: ${optsTexts.join(' | ')}`;
    log.info(`Result: OK: ${citaPlaces}`);

    if (citasCount < 1) {
        frmData.isCitaAvailable = false;
        log.info('no citas has been found... app will exit');
        await delay(1000);
        await createScreenshot(page, 'no-disponible', frmData.CITA_OP);
        await cleanup(CleanupCode.NO_CITAS_DISPONIBLE, 'zero citas has been found');
    }
    
    //Screenshot CITA
    await page.click('#idSede', { delay: 100 });
    const screenshotPath = await createScreenshot(page, 'CITA', frmData.CITA_OP);

    // Mobile Push Notification
    await processPushNotification(frmData, citaPlaces);

    // Email notification
    await processMailNtofications(frmData, citaPlaces, screenshotPath);
}

async function processPushNotification(frmData: CitaFormData, citaPlaces: string): Promise<void> {
    try {
        await sendPushNotification(config.default.mobileNotifier.title, `Cita disponible: ${frmData.CITA_OP} - ${frmData.CITA_OP_DESC}: ${citaPlaces}`, getCitaPageUrl(frmData.provincia));
        log.info('Push notification: sent');
    } catch (err: any) {
        //log.error('Err: sending push notification failed: cita available', err);
        log.warn('Err: cita available, but push notification failed:', err.response.data);
    }
}

async function processMailNtofications(frmData: CitaFormData, citaPlaces: string, screenshotPath: string): Promise<void> {
    // Mail notification
    if (config.default.mailer.enabled === true && config.default.mailer.to.length > 0) {
        try {
            const sendTo = config.default.mailer.to.join(', ');
            await sendMail(
                sendTo,
                config.default.mailer.from,
                `Cita disponible: (${frmData.CITA_OP}) ${frmData.CITA_OP_DESC}`,
                `cita previa available: ${frmData.CITA_OP} - ${frmData.CITA_OP_DESC}`,
//HTML mail content
`<html><body>Cita previa available:
<br>
<b>Date:</b> ${getFormatedDateTime()}
<br>
<b>${frmData.CITA_OP} - ${frmData.CITA_OP_DESC}</b>
<br>
${citaPlaces}
<br>
<span><b>Link:&nbsp;</b><a href="${getCitaPageUrl(frmData.provincia)}">${getCitaPageUrl(frmData.provincia)}</a></span>
<br><br>
<img src="data:image/png;base64,${base64_encode(screenshotPath)}" />
</body></html>`
            );
            log.info(`Email: sent (${sendTo})`);
        } catch (err) {
            log.error('Err: sending mail failed: cita available', err);
        }
    } else {
        if (config.default.mailer.enabled === true) {
            log.warn('Email: not sent, no destination address defined');
        } else {
            log.info('Email: not sent, mailer is disabled');
        }
    }
}

import fs from 'node:fs';
import puppeteer from 'puppeteer';
import arg from 'arg';
import { sendMail } from './services/mailer.service';
import {
    base64_encode,
    cleanupFce,
    createScreenshot,
    delay,
    getFormatedDateTime,
    getProvinciaUrl,
    getRandomUserAgent,
    printHelp
} from './utils';
import { Country, OperationDescription } from './operation-enums';
import { sendPushNotification } from './services/mobile-notifier.service';
import { residency_eu } from './operations/residency_eu';
import { nie } from './operations/nie';
import { CitaFormData } from './models/cita-form-data.model';
import { Log } from './services/logger.service';
import { CleanupCode } from './cleanup-code.enum';
import { config } from './services/config.service';


const log = Log.createLogger('index');
console.log(''); // add empty line
log.info('APPLICATION START with args', process.argv);

const frmData: CitaFormData = new CitaFormData();
frmData.isCitaAvailable = false

const getCitaPageUrl = (provincia: string) => 'https://icp.administracionelectronica.gob.es' + getProvinciaUrl(provincia);
const DEFAULT_PROVINCIA = 'Alicante';

// DEFINE ARGS
let args: any = {};
try {
    args = arg({
        '--help': Boolean,      '-h': '--help',
        '--provincia': String,  '-p': '--provincia',
        '--cita_op': Number,    '-o': '--cita_op',
        '--doc_num': String,    '-d': '--doc_num',
        '--doc_type': String,   '-t': '--doc_type', // optional, N = NIE, D = DNI, P = Passport
        '--name': String,       '-n': '--name',
        '--country': String,    '-c': '--country',
        '--birth-year': Number, '-b': '--birth-year'
    });
} catch (err) {
    console.warn('unknown option');
    printHelp();
    process.exit(1);
}

// RESOLVE ARGS: PROVINCIA
frmData.provincia = args['--provincia'] || DEFAULT_PROVINCIA;


// RESOLVE ARGS: CITA_OP
frmData.CITA_OP = args['--cita_op'] ? String(args['--cita_op']) : '';
if (!frmData.CITA_OP) {
    console.warn('cita_op is not defined!');
    printHelp();
    process.exit(1);
}
frmData.CITA_OP_DESC = OperationDescription[frmData.CITA_OP] || 'UNDEFINED';

// RESOLVE ARGS: DOC_NUM && DOC_TYPE
frmData.DOC_NUM = args['--doc_num'] || null;
frmData.DOC_TYPE = args['--doc_type'] || 'N';
if (!frmData.DOC_NUM) {
    console.warn('Document number is not defined!');
    printHelp();
    process.exit(1);
}
if (!(frmData.DOC_TYPE == 'N' || frmData.DOC_TYPE =='D' || frmData.DOC_TYPE == 'P')) {
    console.warn('Document type error. Wrong type!');
    printHelp();
    process.exit(1);
}

// RESOLVE ARGS: NAME
frmData.NAME = args['--name'] || null;
if (!frmData.NAME) {
    console.warn('name is not defined!');
    printHelp();
    process.exit(1);
}

// RESOLVE ARGS: COUNTRY
// TODO: resolve country based on enum
frmData.COUNTRY = args['--country'] && Country[args['--country']] ? Country[args['--country']] : '';
if (!frmData.COUNTRY) {
    console.warn('country is not defined!');
    printHelp();
    process.exit(1);
}

// RESOLVE ARGS: BIRTH_YEAR
frmData.BIRTH_YEAR = args['--birth-year'] ? String(args['--birth-year']) : '';
if (!frmData.BIRTH_YEAR) {
    console.warn('birth year is not defined!');
    printHelp();
    process.exit(1);
}

function getDocTypeName(docType: string) {
    switch (docType) {
        case 'N':
            return 'NIE';
        case 'D':
            return 'DNI';
        case 'P':
            return 'Passport';
        default:
            return 'Err: DocType';
    }
}

log.info('Provincia:', frmData.provincia);
log.info('CitaOp:', frmData.CITA_OP, frmData.CITA_OP_DESC);
log.info(getDocTypeName(frmData.DOC_TYPE) + ':', frmData.DOC_NUM);
log.info('Name:', frmData.NAME);
log.info('Country:', frmData.COUNTRY, args['--country']);
log.info('Birth year:', frmData.BIRTH_YEAR);


try {
    if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots');
    }
} catch (err) {
    log.warn('folder for screenshots could not be created', err);
}

function logAppExit(exitCode: number) {
    log.debug(`App is exiting with code: ${exitCode}`);
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
    /* const pages = await browser.pages();
    const page = pages[0]; */

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
    try {
        await sendPushNotification(config.default.mobileNotifier.title, `Cita disponible: ${frmData.CITA_OP} - ${frmData.CITA_OP_DESC}: ${citaPlaces}`, getCitaPageUrl(frmData.provincia));
        log.info('Push notification: sent');
    } catch (err: any) {
        //log.error('Err: sending push notification failed: cita available', err);
        log.warn('Err: cita available, but push notification failed:', err.response.data);
    }

    // Mail notification
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


    //Don't cleanup, instead keep the window open to finish the CITA
    logAppExit(0);
    process.exit(0);
  })();

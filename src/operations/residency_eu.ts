import { Page } from 'puppeteer';
import { cleanupFce, delay, waitForNoCitasDisponiblesFce } from '../utils';
import { CitaFormData } from '../models/cita-form-data.model';
import { Log } from '../services/logger.service';
import { CleanupCode } from '../cleanup-code.enum';

export async function residency_eu(page: Page, frmData: CitaFormData, cleanup: cleanupFce, waitForNoCitasDisponibles: waitForNoCitasDisponiblesFce) {
    const log = Log.createLogger('residency_eu');

    // 1st PAGE
    // select value='22' = 'CERTIFICADOS UE'
    // OR
    // select value='4038' = 'POLICIA-CERTIFICADO DE REGISTRO DE CIUDADANO DE LA U.E.'
    const existsSelector1 = await page.$('select[name="tramiteGrupo[1]"]');

    try {
        //await page.waitForSelector('select[name="tramiteGrupo[0]"]');
        await delay(500);

        if (existsSelector1) {
            await page.select('select[name="tramiteGrupo[1]"]', frmData.CITA_OP);
        } else {
            await page.select('select[name="tramiteGrupo[0]"]', frmData.CITA_OP);
        }
    } catch (err) {
        await cleanup(CleanupCode.PAGE_1_SEL_OP_ERR, 'err: select');
    }

    // click aceptar button
    try {
        await delay(500);
        await page.click('#btnAceptar');
    } catch (err) {
        log.error('err: acceptar click 1. page', err);
        await cleanup(CleanupCode.PAGE_1_CLICK_ACC_ERR, 'err: acceptar click 1.page');
    }


    // 1.5 PAGE: confirm info click button
    try {
        await page.waitForSelector('#btnEntrar');
        //await delay(1000);
        await page.click('#btnEntrar');
    } catch (err) {
        log.error('err: entrar click 1.5 confirm page', err);
        await cleanup(CleanupCode.PAGE_1_5_CLICK_CONF_ERR);
    }
    
    waitForNoCitasDisponibles(frmData, page, cleanup);

    // 2nd PAGE FOLLOWS: NIE + Name
    //NIE
    //type id=txtIdCitado, value=NIE
    //Name
    //type id=txtDesCitado, value=NAME
    try {
        await page.waitForSelector('#txtIdCitado');
        await delay(1000);

        // select NIE (by default), DNI or Passport
        if (frmData.DOC_TYPE === 'D') {
            await page.waitForSelector('#rdbTipoDocDni');
            await page.click('#rdbTipoDocDni');
        } else if (frmData.DOC_TYPE === 'P') {
            if (frmData.CITA_OP === '22') {
                await page.waitForSelector('#rdbTipoDocPasDdi');
                await page.click('#rdbTipoDocPasDdi');
            } else {
                await page.waitForSelector('#rdbTipoDocPas');
                await page.click('#rdbTipoDocPas');
            }
        }

        await delay(500);
        await page.focus('#txtIdCitado');
        await page.type('#txtIdCitado', frmData.DOC_NUM);
        await delay(700);
        await page.waitForSelector('#txtDesCitado');
        await page.focus('#txtDesCitado');
        await page.type('#txtDesCitado', frmData.NAME);
        await delay(700);
        // IF 'CERTIFICADO UE' (22)
        if (frmData.CITA_OP === '22') {
            await page.waitForSelector('#txtPaisNac');
            await page.select('#txtPaisNac', frmData.COUNTRY)
        }
    } catch (err) {
        log.error('err: 2nd page NIE+Name', err);
        await cleanup(CleanupCode.PAGE_2_ERR);
    }

    // Acceptar button
    // id=btnEnviar
    try {
        await delay(1000);
        await page.waitForSelector('#btnEnviar');
        await page.click('#btnEnviar');
    } catch (err) {
        log.error('err: 2nd page NIE+Name: enviar click', err);
        await cleanup(CleanupCode.PAGE_2_CLICK_ENVIAR_ERR);
    }



    // 3rd PAGE FOLLOWS: check + enviar
    // Solicitar Cita button
    // id=btnEnviar
    //await page.waitForNavigation();
    try {
        await delay(1000);
        await page.waitForSelector('#btnEnviar');
        await page.click('#btnEnviar');
    } catch (err) {
        log.error('err: 3nd page NIE+Name: enviar click', err);
        await cleanup(CleanupCode.PAGE_3_CLICK_ENVIAR_ERR);
    }

}

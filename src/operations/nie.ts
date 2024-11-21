import { Page } from 'puppeteer';
import { cleanupFce, delay } from '../utils';
import { CitaFormData } from '../models/cita-form-data.model';
import { Log } from '../services/logger.service';
import { CleanupCode } from '../cleanup-code.enum';


export async function nie(page: Page, frmData: CitaFormData, cleanup: cleanupFce) {
    const log = Log.createLogger('nie');

    // 1st PAGE
    // select value='4031' = 'Assignación de NIE'
    try {
        await page.waitForSelector('select[name="tramiteGrupo[1]"]');
        await delay(500);
        await page.select('select[name="tramiteGrupo[1]"]', frmData.CITA_OP);
    } catch (err) {
        await cleanup(CleanupCode.PAGE_1_SEL_OP_ERR, 'err: select');
    }

    // click aceptar button
    try {
        await delay(1000);
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
  

    // 2nd PAGE FOLLOWS: NIE + Name
    // passport: txtIdCitado
    // name: txtDesCitado
    // year (YYYY): txtAnnoCitado
    // country: txtPaisNac
    try {
        await page.waitForSelector('#txtIdCitado');

        await delay(700);
        await page.focus('#txtIdCitado');
        await page.type('#txtIdCitado', frmData.DOC_NUM);
        await delay(700);
        await page.waitForSelector('#txtDesCitado');
        await page.focus('#txtDesCitado');
        await page.type('#txtDesCitado', frmData.NAME);
        await delay(700);
        await page.waitForSelector('#txtAnnoCitado');
        await page.type('#txtAnnoCitado', frmData.BIRTH_YEAR);
        await delay(700);
        await page.waitForSelector('#txtPaisNac');
        await page.select('#txtPaisNac', frmData.COUNTRY)
    } catch (err) {
        log.error('err: 2nd page NIE+Name', err);
        await cleanup(CleanupCode.PAGE_2_ERR);
    }

    // Acceptar button
    // id=btnEnviar
    try {
        await delay(700);
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
        await delay(700);
        await page.waitForSelector('#btnEnviar');
        await page.click('#btnEnviar');
    } catch (err) {
        log.error('err: 3nd page NIE+Name: enviar click', err);
        await cleanup(CleanupCode.PAGE_3_CLICK_ENVIAR_ERR);
    }
}

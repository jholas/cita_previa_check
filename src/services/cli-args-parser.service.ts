import arg from "arg";
import { CitaFormData } from "../models/cita-form-data.model";
import { Country, OperationDescription } from "../operation-enums";
import { Log } from "./logger.service";

const DEFAULT_PROVINCIA = 'Alicante';

const log = Log.createLogger('cli-args-parser');

export function parseCliArgs(): CitaFormData {
    const frmData: CitaFormData = new CitaFormData();

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
        throw Error('unknown option');
    }

    // RESOLVE ARGS: PROVINCIA
    frmData.provincia = args['--provincia'] || DEFAULT_PROVINCIA;


    // RESOLVE ARGS: CITA_OP
    frmData.CITA_OP = args['--cita_op'] ? String(args['--cita_op']) : '';
    if (!frmData.CITA_OP) {
        throw Error('cita_op is not defined!');
    }
    frmData.CITA_OP_DESC = OperationDescription[frmData.CITA_OP] || 'UNDEFINED';

    // RESOLVE ARGS: DOC_NUM && DOC_TYPE
    frmData.DOC_NUM = args['--doc_num'] || null;
    frmData.DOC_TYPE = args['--doc_type'] || 'N';
    if (!frmData.DOC_NUM) {
        throw Error('Document number is not defined!');
    }
    if (!(frmData.DOC_TYPE == 'N' || frmData.DOC_TYPE =='D' || frmData.DOC_TYPE == 'P')) {
        throw Error('Document type error. Wrong type!');
    }

    // RESOLVE ARGS: NAME
    frmData.NAME = args['--name'] || null;
    if (!frmData.NAME) {
        throw Error('name is not defined!');
    }

    // RESOLVE ARGS: COUNTRY
    // TODO: resolve country based on enum
    frmData.COUNTRY = args['--country'] && Country[args['--country']] ? Country[args['--country']] : '';
    if (!frmData.COUNTRY) {
        throw Error('country is not defined!');
    }

    // RESOLVE ARGS: BIRTH_YEAR
    frmData.BIRTH_YEAR = args['--birth-year'] ? String(args['--birth-year']) : '';
    if (!frmData.BIRTH_YEAR) {
        throw Error('birth year is not defined!');
    }

    printCliArgsSummary(frmData, args);

    return frmData;
}

function printCliArgsSummary(frmData: CitaFormData, args: any): void {
    log.info('Provincia:', frmData.provincia);
    log.info('CitaOp:', frmData.CITA_OP, frmData.CITA_OP_DESC);
    log.info(getDocTypeName(frmData.DOC_TYPE) + ':', frmData.DOC_NUM);
    log.info('Name:', frmData.NAME);
    log.info('Country:', frmData.COUNTRY, args['--country']);
    log.info('Birth year:', frmData.BIRTH_YEAR);
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

import axios from 'axios';
import { config } from './config.service';

const mailerUrl = config.default.mailer.url;


function sendMail(mailto: string, from: string, subject: string, msgText: string, msgHtml: string) {
    const mailerBody = 
    {
        to: mailto,
        from: from,
        subject: subject,
        text: msgText,
        html: msgHtml,
        token: config.default.mailer.token
    };

    return axios.post(mailerUrl, mailerBody);
}

export { sendMail };

import axios from "axios";
import { config } from "./config.service";

/**
 * Push notifications to Android phone
 * Provided by:
 *   BuzzerMe (buzzerme.com)
 * 
 * Android app by BuzzerMe required to provide push notifications:
 *   <playstore-link> To Be Provided (still in development)
 */


export function sendPushNotification(title: string, body:string, link: string) {

    const reqUrl = 'https://api.buzzerme.com/notify';

    const reqBody = {
        title,
        body,
        link,
        sound: 'scifi',
        channel: config.default.mobileNotifier.channel,
        image: config.default.mobileNotifier.image
    };


    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': config.default.mobileNotifier.apiKey
    }

    return axios.post(reqUrl, reqBody, {headers});
}

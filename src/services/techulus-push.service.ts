import axios from "axios";
import { config } from "./config.service";

/**
 * Push notifications to Android phone
 * Provided by:
 *   Push by Techulus (push.techulus.com)
 * 
 * Android app by techulus required to provide push notifications:
 *   https://play.google.com/store/apps/details?id=com.techulus.push
 */


export function sendPushNotification(title: string, body:string, link: string) {

    const reqUrl = 'https://push.techulus.com/api/v1/notify';

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

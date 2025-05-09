export interface IMailer {
    /** Indicates if to send email notification */
    enabled: boolean;
    /** Url of mailer php script */
    url: string;
    /** Token to protect mailer against spamming */
    token: string;
    /** List of destination addresses where to send email notification */
    to: string[];
    /**
     * From email address.
     * Can be just simple email address or can be in nice format: 'NiceName <actual.email.address>'
     */
    from: string;
}

export interface IMobileNotifier {
    apiKey: string;
    title: string;
    channel: string;
    image: string;
}

export interface IConfig {
    /** Mailer notification configuration */
    mailer: IMailer;

    /** Mobile push notification configuration */
    mobileNotifier: IMobileNotifier;
}

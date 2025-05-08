![node.js workflow](https://github.com/jholas/cita_previa_check/actions/workflows/node.js.yml/badge.svg)

# cita_previa_check
Application is useful in Spain only. It checks if there's a "cita previa" available at Policia Nacional or Extranjería for tasks like assigning NIE or Residency.

## Preparing the app
- clone or download the repo
- install node packages: `npm i`

## Running the app
1. Run the chrome with remote debugging port set to 9222
   - It's better to run chrome before and let the app connect to that instead of letting app launching the chrome instance. Reason is that cita previa has some checks for robots and it doesn't work properly
    - Run chrome: `"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug"`
      - --user-data-dir is not required, but it might help in case of issues while app tries to connect to chrome
2. Configuration
   1. App settings `app.config.json`
        - mailer settings (mailer)
          - folder `server` contains the mailer server written in php which needs to be configured and deployed
          - then in the app settings the url needs to be set to the mailer
        - push notifications (mobileNotifier)
   2. Operation settings
        - Required cita operation has to be set with required command paramaters
        - open the run.bat and check the examples (NIE, Residency)
        - check `src/opperation-enums` folder for required constants (e.g. operation code, country names, etc.)
3. Run the app
   1. Standalone run
        - run the `.\run.bat` in terminal. The app will run once and finish.
   2. Scheduled run (run the app repeatedly)
        - run the app with provided cron: `npm run start:cron`
        - use system scheduler (e.g. windows: task scheduler, linux: cron)
4. Usage
    - The app will crawl the web page filling in the operation settings and will end up with:
       - No citas disponibles: app will just close the page and log the result in application log,
       - Rejected: if check period is set too frequently it's usually detected and blocked and it will end up as in previous case,
       - Citas available: app will reach the point where it will find a free cita:
           - It will create a screenshot
           - It will try to send an email and push notification (if properly set)
           - Page will stay open and operation has to continue manually
---
<https://hollees.org>, <https://develzone.org> <https://getmy-ip.com>

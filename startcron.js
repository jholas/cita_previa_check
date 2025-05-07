var cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('*/7 * * * *', () => {
    try {
        runCronJob();
    } catch (error) {
        console.error(new Date().toLocaleString() + 'Error running cron job:', error);
    }
});

function runCronJob() {
    console.log(new Date().toLocaleString() + ' - Running cron job...');

    exec('run.bat', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
      
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
      
        console.log(`stdout: ${stdout}`);
      });
}

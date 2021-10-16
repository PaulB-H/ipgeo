const CronJob = require("cron").CronJob;
const fs = require("fs");
const path = require("path");

const { todaysAnalyticObj } = require("./analytic_main");

// crontab.cronhub.io
const fiveMinBackup = new CronJob("0/5 * * * * *", () => {
  fs.writeFile(
    path.join(__dirname, "analytic_backups", "analytic_data.json"),
    JSON.stringify(todaysAnalyticObj),
    (err) => {
      if (err) {
        console.log("Err writing 5 min backup, exiting");
        process.exit();
      }
      console.log("Backup wrote");
    }
  );
});
fiveMinBackup.start();

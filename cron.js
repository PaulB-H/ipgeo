const CronJob = require("cron").CronJob;
const fs = require("fs");
const path = require("path");

const { todaysAnalyticObj } = require("./analytic_main");

// !! ==> Changed to every 5 seconds for dev  <== !! \\
// crontab.cronhub.io - easy cron creation \\
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

// 59 seconds past the minute
// 59 minutes past the hour
// every 23 hours
const dailyBackup = new CronJob("59 59 */23 * * *", () => {
  fs.writeFile(
    path.join(
      __dirname,
      "analytic_backups",
      `${new Date().toLocaleDateString()}.json`
    ),
    JSON.stringify(todaysAnalyticObj),
    (err) => {
      if (err) {
        console.log("Err writing daily backup, exiting");
        process.exit();
      }
      console.log("Daily backup wrote");
    }
  );
});

dailyBackup.start();

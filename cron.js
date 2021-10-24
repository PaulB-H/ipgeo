const CronJob = require("cron").CronJob;
const fs = require("fs");
const path = require("path");

const { todaysAnalyticObj } = require("./analytic_main");

const rootBackupDir = path.join(__dirname, "analytic_backups");
const previousDaysDir = path.join(
  __dirname,
  "analytic_backups",
  "previous_days"
);

// !! ==> Currently every 5 seconds for testing
// crontab.cronhub.io
// Second, Minute, Hour, Day of Month, Month, Day of Week
const fiveMinBackup = new CronJob("0/5 * * * * *", () => {
  fs.writeFile(
    path.join(rootBackupDir, "daily_analytics.json"),
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

// This will run at: (second: 59, minute: 59, hour: 23)
const dailyBackup = new CronJob("59 59 23 * * *", () => {
  const currentDateString = new Date().toLocaleDateString();

  fs.writeFile(
    path.join(previousDaysDir, `${currentDateString}.json`),
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

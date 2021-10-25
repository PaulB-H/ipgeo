const CronJob = require("cron").CronJob;
const fs = require("fs");
const path = require("path");

const { todaysAnalyticObj } = require("./analytic_main");

const rootBackupDir = path.join(__dirname, "analytic_backups");
const previousDaysDir = path.join(rootBackupDir, "previous_days");
const publicRootDir = path.join(rootBackupDir, "public_data");
const publicDailyDir = path.join(publicRootDir, "previous_days_public");

// !! ==> Currently every 5 seconds for testing
// crontab.cronhub.io
// Second, Minute, Hour, Day of Month, Month, Day of Week
const fiveMinBackup = new CronJob("0/5 * * * * *", () => {
  class PublicAnalyticObj {
    constructor() {
      this.date = todaysAnalyticObj.date;
      this.uniqueVisitors = todaysAnalyticObj.iplog.length;
      this.countries = todaysAnalyticObj.countries;
      this.totalSessions =
        todaysAnalyticObj.activeSessions.length +
        todaysAnalyticObj.closedSessions.length;
    }
  }

  const analyticsToSend = new PublicAnalyticObj();

  fs.writeFile(
    path.join(publicRootDir, "public_daily_analytics.json"),
    JSON.stringify(analyticsToSend),
    (err) => {
      if (err) {
        console.log("Err writing 5 min public backup, exiting");
        process.exit();
      }
      console.log("public todays backup wrote");
    }
  );

  fs.writeFile(
    path.join(rootBackupDir, "daily_analytics.json"),
    JSON.stringify(todaysAnalyticObj),
    (err) => {
      if (err) {
        console.log("Err writing 5 min backup, exiting");
        process.exit();
      }
      console.log("todaysAnalyticObj backup wrote");
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

      todaysAnalyticObj.clearFields();
      console.log("Reset todaysAnalyticObj");
    }
  );
});
dailyBackup.start();

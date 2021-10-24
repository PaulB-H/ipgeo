const path = require("path");
const fs = require("fs");
const { todaysAnalyticObj } = require("./analytic_main");

const rootBackupDir = path.join(__dirname, "analytic_backups");
const previousDaysDir = path.join(rootBackupDir, "previous_days");
const emergencyBackupsDir = path.join(rootBackupDir, "emergency_backups");

if (!fs.existsSync(rootBackupDir)) {
  console.log("analytic_backups dir not found, creating...");

  try {
    fs.mkdirSync(rootBackupDir);
  } catch (err) {
    console.log("Err creating analytic_backups dir, exiting...");
    console.log(`err.msg: ${err.message}`);
    process.exit();
  }

  try {
    fs.mkdirSync(previousDaysDir);
  } catch (err) {
    console.log("Err creating previous_days dir, exiting...");
    console.log(`err.msg: ${err.message}`);
    process.exit();
  }

  try {
    fs.mkdirSync(emergencyBackupsDir);
  } catch (err) {
    console.log("Err creating emergency_backup dir, exiting...");
    console.log(`err.msg: ${err.message}`);
    process.exit();
  }

  console.log(
    `dir structure created:\n  analytic_backups\n    |- previousDays\n    |- emergency_backups`
  );
} else {
  console.log(`analytic_backups dir already exists...`);

  if (!fs.existsSync(previousDaysDir)) {
    console.log("previous_days dir missing... creating...");
    try {
      fs.mkdirSync(previousDaysDir);
    } catch (err) {
      console.log("Err creating previous_days dir, exiting...");
      console.log(`err.msg: ${err.message}`);
      process.exit();
    }
    console.log("previous_days dir created");
  }

  if (!fs.existsSync(emergencyBackupsDir)) {
    console.log("emergency_backups dir missing... creating...");
    try {
      fs.mkdirSync(emergencyBackupsDir);
    } catch (err) {
      console.log("Err creating emergency_backups dir, exiting...");
      console.log(`err.msg: ${err.message}`);
      process.exit();
    }
    console.log("emergency_backups dir created");
  }

  if (!fs.existsSync(path.join(rootBackupDir, "daily_analytics.json"))) {
    console.log("No existing daily_analytics.json file found");
  } else {
    console.log(
      "Existing daily_analytics.json backup found, attempting to read..."
    );

    let previousBackupJSON = fs.readFileSync(
      path.join(rootBackupDir, "daily_analytics.json")
    );

    let previousBackupParse;
    try {
      previousBackupParse = JSON.parse(previousBackupJSON);
    } catch (err) {
      console.log("Err parsing existing daily backup, exiting...");
      console.log(`err.msg: ${err.message}`);
      process.exit();
    }
    console.log("daily_analytics.json read and parsed");

    const previousDate = new Date(
      previousBackupParse.date
    ).toLocaleDateString();
    const currentDate = new Date().toLocaleDateString();

    if (previousDate !== currentDate) {
      console.log("Existing data for different day...");

      console.log("Copying existing file to emergency backup...");
      try {
        fs.writeFileSync(
          path.join(
            emergencyBackupsDir,
            `emergencyCapture_${previousDate}.json`
          ),
          JSON.stringify(previousBackupParse)
        );
      } catch (err) {
        console.log("Error saving emergency backup to disc, exiting...");
        console.log(`err.msg: ${err.message}`);
        process.exit();
      }
      console.log("Existing file copied to emergency backup...");

      console.log("Deleting stale daily_analytics.json...");
      try {
        fs.unlinkSync(path.join(rootBackupDir, "daily_analytics.json"));
      } catch (err) {
        console.log("Error removing stale daily backup file, exiting...");
        console.log(`err.msg: ${err.message}`);
        process.exit();
      }
    } else {
      console.log("Backup for today, assigning to todaysAnalyticObj");

      Object.assign(todaysAnalyticObj, previousBackupParse);
    }
  }
}

const fileArray = fs.readdirSync(previousDaysDir);
fileArray.forEach((item, index) => {
  fileArray[index] = item.slice(0, item.length - 5);
});

console.log("Previous backups found for...");
console.log(fileArray);

module.exports = { fileArray };

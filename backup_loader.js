const path = require("path");
const fs = require("fs");
const { todaysAnalyticObj } = require("./analytic_main");

const backupPath = path.join(__dirname, "analytic_backups");

if (!fs.existsSync(backupPath)) {
  // Backup dir does NOT exist
  console.log("analytic_backups dir not found, creating...");

  fs.mkdirSync(backupPath);

  console.log(`analytic_backups dir created at ${backupPath}`);
} else {
  // Backup dir already exists
  console.log(`analytic_backups dir already exists at ${backupPath}`);

  if (!fs.existsSync(path.join(backupPath, "analytic_data.json"))) {
    console.log("No existing backup found");
  } else {
    console.log("Existing backup found, attempting to read...");

    let previousBackupJSON = fs.readFileSync(
      path.join(backupPath, "analytic_data.json")
    );

    try {
      let previousBackupParse = JSON.parse(previousBackupJSON);

      Object.assign(todaysAnalyticObj, previousBackupParse);

      console.log("Data read and parsed");
    } catch (err) {
      console.error("Err parsing backup JSON... Exiting");

      process.exit();
    }
  }
}

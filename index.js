const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const _ = require("lodash");
const requestIp = require("request-ip");
const useragent = require("express-useragent");
const Reader = require("@maxmind/geoip2-node").Reader;
const CronJob = require("cron").CronJob;

const serverStartDateObj = new Date();
const serverStartDate = serverStartDateObj.toLocaleDateString();
const serverStartTime = serverStartDateObj.toLocaleTimeString();

let hasVisited;
let lastVisited;

let analyticDataArr = [];

let backupPath = path.join(__dirname, "analytic_backups");

if (!fs.existsSync(backupPath)) {
  console.log("dir not found, creating...");
  fs.mkdirSync(backupPath);
  console.log(`analytic_backups dir created at ${backupPath}`);
} else {
  console.log(`analytic_backups dir already exists at ${backupPath}`);

  if (!fs.existsSync(path.join(backupPath, "analytic_data.json"))) {
    console.log("No existing backup found");
  } else {
    console.log("Existing backup found, attempting to read...");

    let previousBackupJSON = fs.readFileSync(
      path.join(backupPath, "analytic_data.json")
    );

    try {
      let parsedBackup = JSON.parse(previousBackupJSON);
      analyticDataArr = parsedBackup;
      console.log(
        `Data parsed, ${analyticDataArr.length} items loaded into analyticDataArr`
      );
    } catch (err) {
      console.error("Err parsing JSON...");
      // process.exit();
    }
  }
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(8090, () => {
  console.log("server up on 8090");
});

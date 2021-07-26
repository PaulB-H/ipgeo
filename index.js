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

// let analyticDataObj = {
//   pathHits: [{ path: "/", hits: 0 }],
//   iplog: [{ ip: "888.888.888", visits: 0, lastVisit: 1627065794481 }],
// };

let analyticDataObj = {
  pathHits: [],
  iplog: [],
};

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
      let previousBackupParse = JSON.parse(previousBackupJSON);
      console.log("Data read success");
      analyticDataObj = previousBackupParse;
    } catch (err) {
      console.error("Err parsing JSON...");
      process.exit();
    }
  }
}

app.use(useragent.express());

let urlsToTrack = new Set();
urlsToTrack.add("/");

app.use((req, res, next) => {
  if (urlsToTrack.has(req.url)) {
    console.log("Middleware hit, request for: " + req.url);

    const clientIp = requestIp.getClientIp(req);
    console.log(clientIp);

    console.log(req.useragent.browser);
    console.log(req.useragent.version);
    console.log(req.useragent.os);

    let pathFound = false;
    analyticDataObj.pathHits.forEach((item, index) => {
      if (item.path === req.url) {
        pathFound = true;
        item.hits++;
      }
    });
    if (!pathFound) {
      analyticDataObj.pathHits.push({ path: req.url, hits: 1 });
    }

    let ipFound = false;
    analyticDataObj.iplog.forEach((item, index) => {
      if (item.ip === clientIp) {
        ipFound = true;
        item.visits++;
        item.lastVisit = Date.now();
      }
    });
    if (!ipFound) {
      analyticDataObj.iplog.push({
        ip: clientIp,
        visits: 1,
        lastVisit: Date.now(),
      });
    }

    console.log(analyticDataObj);
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(8090, () => {
  console.log("server up on 8090");
});

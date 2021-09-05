require("dotenv").config();
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

// new daily analytic object structure
class DailyAnalyticObj {
  constructor() {
    this.date = Date.now();
    this.activeSessions = [];
    this.closedSessions = [];
    this.resourceRequests = [];
    this.iplog = [];
  }
}

let todaysAnalyticObj = new DailyAnalyticObj();

class NewSession {
  constructor(ip, browser, browserVersion, os, country, city, lat, lon) {
    this.sessionStartTime = Date.now();
    this.lastAction = Date.now();

    this.ip = ip;
    this.browser = browser;
    this.browserVersion = browserVersion;
    this.os = os;

    this.sessionRequests = [];

    this.initialScreenWidth = null;
    this.initialScreenHeight = null;
    this.country = country;
    this.city = city;
    this.lat = lat;
    this.lon = lon;

    this.sessionEndTime = null;
  }
}

class ResourceRequest {
  constructor(url) {
    this.url = url;
    this.timeRequested = Date.now();
  }
}

class IPCapture {
  constructor(ip) {
    this.ip = ip;
    this.sessions = 1;
    this.lastVisit = Date.now();
  }
}

let backupPath = path.join(__dirname, "analytic_backups");

if (!fs.existsSync(backupPath)) {
  // console.log("analytic_backups dir not found, creating...");

  fs.mkdirSync(backupPath);

  console.log(`analytic_backups dir created at ${backupPath}`);
} else {
  // console.log(`analytic_backups dir already exists at ${backupPath}`);

  if (!fs.existsSync(path.join(backupPath, "analytic_data.json"))) {
    console.log("No existing backup found");
  } else {
    // console.log("Existing backup found, attempting to read...");

    let previousBackupJSON = fs.readFileSync(
      path.join(backupPath, "analytic_data.json")
    );

    try {
      let previousBackupParse = JSON.parse(previousBackupJSON);

      // console.log("Data read and parsed");

      todaysAnalyticObj = previousBackupParse;
    } catch (err) {
      // console.error("Err parsing JSON... Exiting");

      process.exit();
    }
  }
}

app.use(useragent.express());

let createNewSessionAsync = async (clientIp, browser, version, os) => {
  let country = null;
  let city = null;
  let latitude = null;
  let longitude = null;

  await Reader.open("./GeoLite2-City.mmdb")
    .then((reader) => {
      const response = reader.city(clientIp);

      country = response.country.names.en;
      city = response.city.names.en;
      latitude = response.location.latitude;
      longitude = response.location.longitude;
    })
    .catch((err) => {
      console.log(err);
    });

  let newSession = new NewSession(
    clientIp,
    browser,
    version,
    os,
    country,
    city,
    latitude,
    longitude
  );

  return newSession;
};

app.use(async (req, res, next) => {
  const { browser, version, os } = req.useragent;

  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  const existingSession = todaysAnalyticObj.activeSessions.find(
    (item) => item.ip === clientIp
  );

  if (!existingSession) {
    let newSession = await createNewSessionAsync(
      clientIp,
      browser,
      version,
      os
    );

    let newRequest = new ResourceRequest(req.url);
    newSession.sessionRequests.push(newRequest);

    todaysAnalyticObj.activeSessions.push(newSession);
  } else {
    // console.log("Existing session found");

    let lastAction = existingSession.lastAction;
    let currTime = Date.now();

    if (currTime - lastAction >= 300000) {
      // console.log("Session expired, creating new session...");

      let index = todaysAnalyticObj.activeSessions.indexOf(existingSession);
      let splicedClosedSession = todaysAnalyticObj.activeSessions.splice(
        index,
        1
      );
      splicedClosedSession[0].sessionEndTime = Date.now();
      todaysAnalyticObj.closedSessions.push(splicedClosedSession);

      let newSession = await createNewSessionAsync(
        clientIp,
        browser,
        version,
        os
      );

      let newRequest = new ResourceRequest(req.url);
      newSession.sessionRequests.push(newRequest);

      todaysAnalyticObj.activeSessions.push(newSession);
    } else {
      // console.log("Session open... Extending");

      let newRequest = new ResourceRequest(req.url);
      existingSession.sessionRequests.push(newRequest);

      existingSession.lastAction = Date.now();
    }
  }

  next();
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(8090, () => {
  console.log("server up on 8090");
});

// crontab.cronhub.io
const fiveMinBackup = new CronJob("0 */5 * * * *", () => {
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

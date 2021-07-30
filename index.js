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
    this.hits = 1;
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

let analyticDataObj = { pathHits: [], iplog: [] };

app.use(async (req, res, next) => {
  const { browser, version, os } = req.useragent;

  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  const existingSession = todaysAnalyticObj.activeSessions.find(
    (element) => element.ip === clientIp
  );

  if (!existingSession) {
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

    todaysAnalyticObj.activeSessions.push(newSession);
  } else {
    // console.log("Existing session found");
  }

  if (urlsToTrack.has(req.url)) {
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

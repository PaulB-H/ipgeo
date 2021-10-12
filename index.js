"use strict";
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

// new daily analytic object structure
class DailyAnalyticObj {
  constructor() {
    this.date = Date.now();
    this.activeSessions = [];
    this.closedSessions = [];
    // this.resourceRequests = [];
    this.iplog = [];
    this.countries = [];
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

class SessionResourceRequest {
  constructor(url) {
    this.url = url;
    this.timeRequested = Date.now();
  }
}

class CountryCapture {
  constructor(country) {
    this.country = country;
    this.uniqueHits = 1;
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

  if (!todaysAnalyticObj.iplog.find((item) => item === clientIp)) {
    todaysAnalyticObj.iplog.push(clientIp);

    const existingCountryCapture = todaysAnalyticObj.countries.find(
      (item) => item.country === country
    );
    if (!existingCountryCapture) {
      let newCountryCapture = new CountryCapture(country);

      todaysAnalyticObj.countries.push(newCountryCapture);
    } else {
      existingCountryCapture.hits++;
    }
  }

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

const logResourceRequest = (clientIp, resource) => {
  // console.log("logResourceRequest called");

  const existingSession = todaysAnalyticObj.activeSessions.find(
    (item) => item.ip === clientIp
  );

  if (existingSession) {
    let newRequest = new SessionResourceRequest(resource);
    existingSession.sessionRequests.push(newRequest);
  }

  // console.log(existingSession);
};

// Session Management
// Check if session exists for IP in analytic object
// If false, create new session
// If true, check if session should be expired
// --> If expired, close old then create new session
// --> If not expired, update session last action time
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

      todaysAnalyticObj.activeSessions.push(newSession);
    } else {
      // console.log("Session open... Extending");

      existingSession.lastAction = Date.now();
    }
  }

  next();
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));

app.get("/", (req, res) => {
  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  logResourceRequest(clientIp, "/");

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/screensize/:width/height/:height", (req, res) => {
  // console.log("screensize route hit");

  if (req.params.width % 1 !== 0 || req.params.height % 1 !== 0) {
    // console.log("Screen size cannot be decimal");
    res.end();
  }

  if (req.params.width <= 0 || req.params.height <= 0) {
    // console.log("Screen size cannot be negative");
    res.end();
  }

  if (req.params.width > 10000 || req.params.height > 10000) {
    // console.log("Screen size cannot be > 10000");
    res.end();
  }

  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  const existingSession = todaysAnalyticObj.activeSessions.find(
    (item) => item.ip === clientIp
  );

  if (existingSession) {
    logResourceRequest(clientIp, "/screensize");
  }

  if (
    existingSession &&
    existingSession.initialScreenWidth === null &&
    existingSession.initialScreenHeight === null
  ) {
    // console.log("Existing session with no screen size found");
    existingSession.initialScreenWidth = req.params.width;
    existingSession.initialScreenHeight = req.params.height;
  }

  res.end();
});

app.get("/analytics", (req, res) => {
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

  res.json(analyticsToSend);
});

app.get("*", (req, res) => {
  // console.log("404 hit");

  let reqUrl;

  if (req.url.length > 25) {
    // console.log("req.url longer than 25 chars, truncating");

    for (let i = 1; i < 25; i++) {
      reqUrl += req.url.charAt(i);
    }
  } else {
    reqUrl = req.url;
  }

  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  logResourceRequest(clientIp, "404 - " + reqUrl);

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

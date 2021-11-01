const path = require("path");
const { fs, access, constants } = require("fs");
const express = require("express");
const router = express.Router();

const { fileArray } = require("./backup_loader.js");
const { todaysAnalyticObj, logResourceRequest } = require("./analytic_main");

const rootBackupDir = path.join(__dirname, "analytic_backups");
const publicRootDir = path.join(rootBackupDir, "public_data");
const publicDailyDir = path.join(publicRootDir, "previous_days_public");
const publicDailyAnalyticsPath = path.join(
  publicRootDir,
  "public_daily_analytics.json"
);

router.get("/", (req, res) => {
  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  logResourceRequest(clientIp, "/");

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

router.get("/screensize/:width/height/:height", (req, res) => {
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

router.get("/todaysanalytics", (req, res) => {
  res.sendFile(publicDailyAnalyticsPath);
});

router.get("/previousdates", (req, res) => {
  res.json(fileArray);
});

router.get("/useragent", (req, res) => {
  const useragentDataArr = [];

  for (const property in req.useragent) {
    if (req.useragent[property] === true) {
      useragentDataArr.push(property);
    } else if (typeof req.useragent[property] === "string") {
      useragentDataArr.push(req.useragent[property]);
    }
  }

  res.json(useragentDataArr);
});

router.get("/previousBackup/:date", (req, res) => {
  if (req.params.date.length !== 10) {
    res.status(400);
    res.json({ err: "Date incorrect length" });
  } else {
    const requestPath = path.join(
      publicDailyDir,
      `public_${req.params.date}.json`
    );

    access(requestPath, constants.F_OK | constants.R_OK, (err) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.status(404);
          res.json({ err: "File not found" });
        } else {
          res.status(500);
          res.json({ err: "File not readable" });
        }
      } else {
        res.sendFile(requestPath);
      }
    });
  }
});

router.get("*", (req, res) => {
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

module.exports = router;

const path = require("path");
const express = require("express");
const router = express.Router();

const { todaysAnalyticObj, logResourceRequest } = require("./analytic_main");

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

router.get("/analytics", (req, res) => {
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

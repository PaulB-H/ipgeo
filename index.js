"use strict";
require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const useragent = require("express-useragent");

const slowDown = require("express-slow-down");
const speedLimiter = slowDown({
  windowMs: 10 * 1000, // 10 seconds
  delayAfter: 10, // allow 10 requests per 10 seconds, then...
  delayMs: 10, // begin adding 10ms of delay per request above 10:
  // request # 11 is delayed by 10ms
  // request # 12 is delayed by 20ms
  // request # 13 is delayed by 30ms
});
app.use(speedLimiter);

require("./backup_loader");

app.use(useragent.express());

const sessionManagement = require("./analytic_middleware");
app.use(sessionManagement);

app.use(express.static(path.join(__dirname, "public"), { index: false }));

const routes = require("./routes");
app.use(routes);

app.listen(8090, () => {
  console.log("server up on 8090");
});

require("./cron");

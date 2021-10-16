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

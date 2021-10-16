"use strict";
require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const useragent = require("express-useragent");

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

"use strict";
// concurrency
const throng = require("throng");
const WORKERS = process.env.WEB_CONCURRENCY || 1;
const PORT = process.env.PORT || 3000;

// initiate
throng({
  count: WORKERS,
  lifetime: Infinity,
  worker: start,
});

// multi processing
function start(id, disconnect) {
  const logger = require("./lib/logger");
  logger.log({
    level: "info",
    message: `Service started ${id}`,
  });

  // Module Dependencies
  // -------------------
  var express = require("express");
  var bodyParser = require("body-parser");

  var http = require("http");
  var path = require("path");

  // var routes = require("./routes");
  var activity = require("./routes/activity");
  // libraries
  const Configs = require("./lib/configs");
  const JWT = require("./lib/jwt_decoder");
  const SFAssets = require("./lib/sf_assets");
  const Gateway = require("./lib/gateways");
  const SFDC = require("./lib/sfdc");
  //routes
  const Execute = require("./routes/execute");
  const Save = require("./routes/save");
  const Publish = require("./routes/publish");
  const Validate = require("./routes/validate");
  const Stop = require("./routes/stop");

  // EXPRESS CONFIGURATION
  var app = express();

  // Configure Express
  app.set("port", PORT);

  app.use(bodyParser.raw({ type: "application/jwt" }));
  app.use(express.static(path.join(__dirname, "public")));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    // marketing cloud does not like to rename paths
    // ideally :country would be set in the route
    req.params.country = "SG";
    next();
  });
  // config
  app.get("/config.json", [Configs]);
  // Custom Routes for MC
  app.post("/journeybuilder/save", [Save]);
  app.post("/journeybuilder/stop", [Stop]);
  app.post("/journeybuilder/validate", [Validate]);
  app.post("/journeybuilder/publish", [Publish]);
  app.post("/journeybuilder/execute", [JWT, Gateway, SFDC, Execute]);

  // Custom Routes Created to pull Data for Application
  app.get("/reqTemplateSMS", SFAssets);

  // Custom Routes to receive back data from the vendor
  app.post("/smsReceive", activity.smsResponse);
  app.post("/shortenLinkReport", activity.shortenLinkReport);

  http.createServer(app).listen(app.get("port"), () => {
    logger.log({
      level: "info",
      message: "Express server listening on port " + app.get("port"),
      sms_sg_mode: process.env.SMS_SG_TESTING
        ? "Testing - SMS will not be Sent"
        : "Production - SMS will be Sent",
    });
  });
}

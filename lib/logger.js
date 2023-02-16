"use strict";
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json, label } = format;

const Server = process.env.HEROKU_DNS_DYNO_NAME;

const logger = createLogger({
  format: combine(label({ label: Server }), timestamp(), json()),
  transports: [new transports.Console()],
});
module.exports = logger;

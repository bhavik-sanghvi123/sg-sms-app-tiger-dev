"use strict";
const assert = require("assert").strict;
const config = require("./config.json");
assert(process.env.CA_URI_SG, "Cannot find environment: CA_URI_SG");
assert(process.env.ENV, "Cannot find environment: ENV");
const route = (req, res) => {
  const country = req.params.country || "SG";
  const url = process.env.CA_URI_SG;
  // there is a memory link here since node does not reimport the file each time
  let localconfig = JSON.parse(JSON.stringify(config));
  localconfig.lang[
    "en-US"
  ].name = `${country} ${process.env.ENV} ${config.lang["en-US"].name}`;
  localconfig.arguments.execute.url = `${url}${config.arguments.execute.url}`;
  localconfig.configurationArguments.save.url = `${url}${config.configurationArguments.save.url}`;
  localconfig.configurationArguments.publish.url = `${url}${config.configurationArguments.publish.url}`;
  localconfig.configurationArguments.stop.url = `${url}${config.configurationArguments.stop.url}`;
  localconfig.configurationArguments.validate.url = `${url}${config.configurationArguments.validate.url}`;

  res.json(localconfig);
};

module.exports = {
  route,
};

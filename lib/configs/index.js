"use strict";
const Configs = {
  SG: require("./sg_config"),
};
const DEFAULT = "SG";
module.exports = (req, res, next) => {
  const countrycode = req.params.country || DEFAULT;
  return Configs[countrycode].route(req, res, next);
};

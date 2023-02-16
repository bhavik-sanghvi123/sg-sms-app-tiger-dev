"use strict";
const SG = require("./sg_sfdc");

const SFDC = {
  SG,
};
const DEFAULT = "SG";
module.exports = (req, res, next) => {
  const countrycode = req.params.country || DEFAULT;
  return SFDC[countrycode].route(req, res, next);
};

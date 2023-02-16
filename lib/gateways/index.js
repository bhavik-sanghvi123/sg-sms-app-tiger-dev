"use strict";
const Gateways = {
  SG: require("./sg_sms_gateway"),
};
const DEFAULT = "SG";
module.exports = (req, res, next) => {
  const countrycode = req.params.country || DEFAULT;
  return Gateways[countrycode].route(req, res, next);
};

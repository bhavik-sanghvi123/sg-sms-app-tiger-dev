"use strict";
// logger
const logger = require("./logger");
const jsonwebtoken = require("jsonwebtoken");
const assert = require("assert");
assert(process.env.JWT_SECRET, "Cannot find environment: JWT_SECRET");

const validate_token = (req, res, next) => {
  try {
    assert(req.body, "No Body found");
    const body = req.body.toString();
    const token = process.env.JWT_SECRET;
    const algorithm = { algorithm: "HS256" };
    const result = jsonwebtoken.verify(body, token, algorithm);
    assert(result.inArguments.length, 1, "No results found");
    const [sfmc_decoded] = result.inArguments;

    req.SFMCDecoded = sfmc_decoded;

    next();
  } catch (error) {
    logger.log({
      level: "warn",
      message: "Failed to Authenticate",
    });
    res.status(500).send("Failed to Authenticate");
  }
};

module.exports = validate_token;

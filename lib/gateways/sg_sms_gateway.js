"use strict";
const axios = require("axios");
const assert = require("assert").strict;
const { decode } = require("html-entities");
const qs = require("querystring");

assert(process.env.SMS_SG_USERNAME, "Cannot find environment: SMS_SG_USERNAME");
assert(process.env.SMS_SG_PASSWORD, "Cannot find environment: SMS_SG_PASSWORD");
assert(
  process.env.SMS_SG_URL_REPLACEMENT_LENGTH,
  "Cannot find environment: SMS_SG_URL_REPLACEMENT_LENGTH"
);

const SMS_SG_TESTING = process.env.SMS_SG_TESTING ? true : false;

const SMS_SG_URL_REPLACEMENT_LENGTH = Number(
  process.env.SMS_SG_URL_REPLACEMENT_LENGTH | 0
);

const Country = "SG";
const CommzgateErrors = {
  "01010": "Success",
  "01011": "Invalid Request format",
  "01012": "Unauthorized access",
  "01013": "Transient System Error,",
  "01014": "Unable to route to mobile operator",
  "01015": "Credit balance insufficient",
  "01018": "Mobile number is blacklisted",
};

const stripHTMLEntities = (escaped) => {
  return decode(escaped);
};
const DecodeCommzgate = (response) => {
  const [state, responsetoken] = response.split(",");
  const human = state === "01010" ? "Completed" : "Failed";
  return {
    state,
    responsetoken: responsetoken || null,
    status: CommzgateErrors[state],
    human,
  };
};

const Mock = async ({ message, smsBoolean }) => {
  const isNotAllowed = sms_not_allowed(smsBoolean);
  if (isNotAllowed) throw new Error("SMS not allowed");

  const queryURL = "https://www.commzgate.net:442/gateway/SendMessage";
  const StartTimestamp = new Date().getTime();

  return axios({
    url: queryURL,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: qs.stringify(message),
  })
    .then(({ data, status: HTTPStatus }) => {
      const EndTimestamp = new Date().getTime();
      const TimeInSeconds = (EndTimestamp - StartTimestamp) / 1000;
      const gateway = DecodeCommzgate(data);
      return { gateway, HTTPStatus, TimeInSeconds };
    })
    .catch(({ response }) => {
      const EndTimestamp = new Date().getTime();
      const TimeInSeconds = (EndTimestamp - StartTimestamp) / 1000;
      return {
        HTTPStatus: response.status,
        gateway: {
          state: null,
          responsetoken: null,
          status: null,
          human: null,
        },
        TimeInSeconds,
      };
    });
};

const Send = async ({ message, smsBoolean }) => {
  const isNotAllowed = sms_not_allowed(smsBoolean);
  if (isNotAllowed) throw new Error("SMS not allowed");

  const queryURL = "https://www.commzgate.net/gateway/SendMessage-beta.php";
  const StartTimestamp = new Date().getTime();
  return axios({
    url: queryURL,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: qs.stringify(message),
  })
    .then(({ data, status: HTTPStatus }) => {
      const EndTimestamp = new Date().getTime();
      const TimeInSeconds = (EndTimestamp - StartTimestamp) / 1000;
      const gateway = DecodeCommzgate(data);
      return { gateway, HTTPStatus, TimeInSeconds };
    })
    .catch(({ response }) => {
      const EndTimestamp = new Date().getTime();
      const TimeInSeconds = (EndTimestamp - StartTimestamp) / 1000;
      return {
        HTTPStatus: response.status,
        TimeInSeconds,
        gateway: {
          state: null,
          responsetoken: null,
          status: null,
          human: null,
        },
      };
    });
};

const uriLength = (message) => {
  const match = message.match(/(http[s]?:\/\/.*?)(\. |\s)/);
  if (!match) return 0;
  const [, value] = match;
  return value.length;
};

const maxLength = (message) => {
  const replacement = SMS_SG_URL_REPLACEMENT_LENGTH;
  const max = 160;
  let adjustedLength = message.length;

  if (!message) throw new Error("Empty message");

  const urllength = uriLength(message);

  if (urllength > 0) {
    adjustedLength = adjustedLength - urllength + replacement;
  }

  if (adjustedLength > max) throw new Error("Message too long");

  return message;
};

const sms_not_allowed = (value) => {
  return value === "True" ? true : false;
};

const Message = ({ phoneNumber, textMessage, brandNames: Sender }) => {
  // strip out HTML entities and replace with their character sets
  textMessage = stripHTMLEntities(textMessage);
  const Mobile = formatValidation(phoneNumber);
  const Message = maxLength(textMessage);
  if (!Sender) {
    throw new Error("No Brand Name Found");
  }

  return {
    ID: process.env.SMS_SG_USERNAME,
    Password: process.env.SMS_SG_PASSWORD,
    Type: "AUTO",
    Mobile: `65${Mobile}`,
    Message,
    Sender,
    Shorten: "true",
  };
};

const formatValidation = (phonenumber) => {
  if (!phonenumber) {
    throw new Error("No Mobile Number");
  }

  phonenumber = phonenumber.trim().split(" ").join("");
  // https://en.wikipedia.org/wiki/Telephone_numbers_in_Singapore#Numbering_scheme_and_format_number
  const value = phonenumber.match(/([8|9][0-9]{7})$/m);
  if (!value) {
    throw new Error("Invalid Mobile Number");
  }
  const [match] = value;
  return match;
};

const route = (req, res, next) => {
  if (SMS_SG_TESTING) {
    req.Gateway = {
      Country,
      Message,
      Send: Mock,
    };
  } else {
    req.Gateway = {
      Country,
      Message,
      Send,
    };
  }

  next();
};

module.exports = {
  route,
  formatValidation,
  Send,
  Country,
  Message,
  sms_not_allowed,
  DecodeCommzgate,
  CommzgateErrors,
  Mock,
  stripHTMLEntities,
  uriLength,
  maxLength,
};

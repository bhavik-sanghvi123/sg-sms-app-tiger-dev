/**
 * @jest-environment node
 */

"use strict";

jest.mock("../lib/logger");

require("axios-debug-log");

const logger = require("../lib/logger");
const Execute = require("./execute");

const _req = () => {
  return {
    params: { country: "SG" },
    SFMCDecoded: {
      campaignName: "Mock",
      phoneNumber: "93911204",
      textMessage: "Test message",
      brandNames: "brand name",
      smsBoolean: "False",
      contactID: "1234",
      shortMsg: "Test message",
      firstName: "John",
      lastName: "Doe",
      selectedMsgID: "MessageID",
    },
  };
};
const _res = () => {
  return {
    statusCode: 100,
    send(args) {
      return args;
    },
    status(args) {
      this.statusCode = args;
      return this;
    },
  };
};

const next = () => (value) => console.log("next", value);

let res = {};
let req = {};
const SFDC = (req, res) => {
  req.SFDC = {
    UpdateUser: jest.fn(),
  };
};
const SMS_SG_TESTING = process.env.SMS_SG_TESTING ? true : null;

describe("test execution of SMS", () => {
  beforeEach(async () => {
    const Gateway = require("../lib/gateways");
    // switch interfaces so we dont send messages
    process.env.SMS_SG_TESTING = "testing";
    res = _res();
    req = _req();

    for await (let fn of [Gateway, SFDC]) {
      await fn(req, res, next);
    }
  });

  afterEach(() => {
    process.env.SMS_SG_TESTING = SMS_SG_TESTING;
    jest.resetModules();
    logger.log.mockReset();

    res = null;
    req = null;
  });

  test("Test that we do not send an SMS as we have blocked it", async () => {
    req.SFMCDecoded.smsBoolean = "True";
    await Execute(req, res, next);
    const error = {
      contactID: expect.any(String),
      message: "SMS not allowed",
      thrown: "Error",
      level: "warn",
    };

    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });

  test("That we can send an SMS when our credentials exist", async () => {
    await Execute(req, res);

    const error = {
      HTTPStatus: 200,
      campaignName: expect.any(String),
      contactID: expect.any(String),
      level: "info",
      responsetoken: expect.any(String),
      smsBoolean: "False",
      state: "01010",
      status: "Success",
    };
    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });

  test("that we can change the credentials so we fail", async () => {
    const holder = process.env.SMS_SG_USERNAME;
    process.env.SMS_SG_USERNAME = "fakename";

    await Execute(req, res);
    const error = {
      HTTPStatus: 200,
      campaignName: expect.any(String),
      contactID: expect.any(String),
      level: "warn",
      responsetoken: null,
      smsBoolean: "False",
      state: "01012",
      status: "Unauthorized access",
    };
    process.env.SMS_SG_USERNAME = holder;
    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });

  test("invalid mobile number", async () => {
    req.SFMCDecoded.phoneNumber = "";

    await Execute(req, res);
    const error = {
      contactID: expect.any(String),
      level: "warn",
      message: "Invalid Mobile Number",
      thrown: "Error",
    };
    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });

  test("null mobile number", async () => {
    req.SFMCDecoded.phoneNumber = null;

    await Execute(req, res);
    const error = {
      contactID: expect.any(String),
      level: "warn",
      message: "Invalid Mobile Number",
      thrown: "Error",
    };
    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });

  test("null brand name", async () => {
    req.SFMCDecoded.brandNames = null;

    await Execute(req, res);
    const error = {
      contactID: expect.any(String),
      level: "warn",
      message: "No Brand Name Found",
      thrown: "Error",
    };
    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });

  test("special character", async () => {
    req.SFMCDecoded.textMessage = "&lt;adv> False, this";

    await Execute(req, res);
    const error = {
      HTTPStatus: 200,
      campaignName: expect.any(String),
      contactID: expect.any(String),
      level: "info",
      responsetoken: expect.any(String),
      smsBoolean: "False",
      state: "01010",
      status: "Success",
    };
    expect(logger.log.mock.calls[0][0]).toEqual(expect.objectContaining(error));
  });
});

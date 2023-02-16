"use strict";

/*
 * POST Handler for the business logic behind execute
 */
const logger = require("../lib/logger");

module.exports = async (req, res) => {
  // Load the facilities that we need
  const { Message, Send, Mock } = req.Gateway;

  const {
    campaignName,
    phoneNumber,
    textMessage,
    brandNames,
    smsBoolean,
    contactID,
    shortMsg,
    firstName,
    lastName,
    selectedMsgID,
  } = req.SFMCDecoded;
  const { UpdateUser } = req.SFDC;

  try {
    // create the message
    const message = Message({
      phoneNumber,
      textMessage,
      brandNames,
    });

    const { gateway, HTTPStatus, TimeInSeconds } = await Send({
      message,
      smsBoolean,
    });

    const { state, responsetoken, status, human } = gateway;

    const msgId = responsetoken ? responsetoken : state;

    // run this async since it does not dictact the response code
    UpdateUser({
      contactID,
      statusOfMsg: human,
      campaignName,
      shortMsg,
      msgId,
    });

    // if its a transient error, we should get SFMC to retry
    const statusCode = state === "01013" ? 500 : 200;
    const level = human === "Completed" ? "info" : "warn";
    // log
    logger.log({
      level,
      contactID: contactID || "Not Found",
      HTTPStatus,
      state,
      responsetoken,
      status,
      smsBoolean,
      campaignName,
      TimeInSeconds,
    });

    res.status(statusCode).send("Execute");
  } catch (error) {
    logger.log({
      level: "warn",
      contactID,
      campaignName,
      thrown: error.name,
      message: error.message,
    });
    // other error we dont know what happened
    res.status(200).send("Execute");
  }
};

"use strict";

const { Pool } = require("pg");
const connectionString = process.env.POSTGRES_SG;
const POSTGRES_SG_TABLE = process.env.POSTGRES_SG_TABLE;
const logger = require("../lib/logger");
const { formatValidation } = require("../lib/gateways/sg_sms_gateway");

exports.logExecuteData = [];

/*


/*
 * POST Handler for retreiving 2 way SMS
 * PARAMS :
 *      Mobile=65<PHONE_NUM>
 *      Message=<MESSAGE>
 */
exports.smsResponse = function (request, response) {
  response.status(200).json(request.body); // show the data that is parsed into the page
  console.log(request.body);

  let { Mobile: mobileNum, Message: textMessage } = request.params;

  if (mobileNum !== undefined && textMessage !== undefined) {
    console.log("Message is defined with a phone number");
    mobileNum = formatValidation(mobileNum);

    const pool = new Pool({
      connectionString: connectionString,
    });

    // Retreiving the keyword from campaigns of a contact
    // using the contact id, get the campaigns that are under the contact.
    // After getting the campaigns, get the keywords that are associated to that campaign
    let queryCampaignKeywords = `SELECT Keyword__c, Campaign__c 
                                      FROM ${POSTGRES_SG_TABLE}.SMS_Keyword__c 
                                      WHERE Active__c = True
                                      AND Campaign__c IN (
                                          SELECT DISTINCT et4ae5__campaign__c 
                                          FROM ${POSTGRES_SG_TABLE}.et4ae5__SMSDefinition__c 
                                          WHERE et4ae5__Contact__c 
                                          IN (
                                              SELECT sfid 
                                              FROM ${POSTGRES_SG_TABLE}.Contact 
                                              WHERE Phone = '${mobileNum}'
                                              )
                                      );`;

    pool.query(queryCampaignKeywords, (err, res) => {
      console.log("===== Querying Rows =====");
      let responseRows = res.rows;

      for (
        let smsKeywordArr = 0;
        smsKeywordArr < responseRows.length;
        smsKeywordArr++
      ) {
        //  smsKeyword['keyword__c']
        //  smsKeyword['campaign__c']

        const smsKeyword = responseRows[smsKeywordArr];
        console.log("KEYWORD >>", smsKeyword);

        if (textMessage.includes(smsKeyword["keyword__c"])) {
          console.log("Campaign ID >>", smsKeyword["campaign__c"]);

          let updateSMSdef = `UPDATE ${POSTGRES_SG_TABLE}.et4ae5__SMSDefinition__c 
                                          SET et4ae5__Message_Text__c = '${textMessage}' 
                                          WHERE et4ae5__Contact__c = (
                                              SELECT sfid 
                                              FROM ${POSTGRES_SG_TABLE}.Contact 
                                              WHERE Phone = '${mobileNum}'
                                          )`;

          pool.query(updateSMSdef, (err, res) => {
            console.log(err, res);
            pool.end();
          });
        }
      }
    });
  }
};

exports.shortenLinkReport = function (request, response) {
  response.status(200).text("OK"); // show the data that is parsed into the page
  console.log(request.body);
  console.log(request.query);
  let {
    MessageID: messageId,
    Type: type,
    Mobile: mobileNum,
    ClickedTimestamp: clickedTimestamp,
    DeviceOS: deviceOS,
    Browser: browser,
    IPaddress: ipAddress,
    OriginalURL: ogURL,
    RepeatedClick: repeatedClick,
  } = request.query;
    console.log(messageId);
    console.log(type);
  if (messageId !== undefined && type !== undefined && type == "Report") {
    console.log("Message is defined with a message Id");

    mobileNum = formatValidation(mobileNum);

    const pool = new Pool({
      connectionString: connectionString,
    });

    // Retreiving the keyword from campaigns of a contact
    // using the contact id, get the campaigns that are under the contact.
    // After getting the campaigns, get the keywords that are associated to that campaign
    let queryIdPresence = `SELECT sfid
                                  FROM ${POSTGRES_SG_TABLE}.et4ae5__SMSDefinition__c 
                                  WHERE unique_id__c = '${messageId}';`;

    pool.query(queryIdPresence, (err, res) => {
      console.log("===== Querying Rows =====");
      let responseRows = res.rows;

      if (responseRows !== undefined) {
        let updateSMSdef = `UPDATE ${POSTGRES_SG_TABLE}.et4ae5__SMSDefinition__c 
                                        SET DateTimeClicked__c = '${clickedTimestamp}',
                                        IPAddress__c = '${ipAddress}',
                                        MobileBrowser__c = '${browser}',
                                        MobileNumber__c = '${mobileNum}',
                                        MobileOS__c = '${deviceOS}',
                                        OriginalURL__c = '${ogURL}'
                                        WHERE unique_id__c  = '${messageId}'`;

        pool.query(updateSMSdef, (err, res) => {
          logger.log({
            level: "info",
            messageId,
            type,
            mobileNum,
            clickedTimestamp,
            deviceOS,
            browser,
            ogURL,
            err,
            res,
          });

          pool.end();
        });
      } else {
        logger.log({
          level: "info",
          message: "Message Id not found in database",
          messageId,
          type,
          mobileNum,
          clickedTimestamp,
          deviceOS,
          browser,
          ogURL,
        });
      }
    });
  } else {
    logger.log({
      level: "info",
      message: "Was not in scope",
      messageId,
      type,
      mobileNum,
      clickedTimestamp,
      deviceOS,
      browser,
      ogURL,
    });
  }
};

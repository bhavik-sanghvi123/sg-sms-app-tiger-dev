"use strict";
const assert = require("assert").strict;
const { Pool } = require("pg");
const logger = require("../logger");

assert(process.env.POSTGRES_SG, "Cannot find environment: POSTGRES_SG");
const connectionString = process.env.POSTGRES_SG;
assert(
  process.env.POSTGRES_SG_TABLE,
  "Cannot find environment: POSTGRES_SG_TABLE"
);
const POSTGRES_SG_TABLE = process.env.POSTGRES_SG_TABLE;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const LookupCampaignID = async ({ campaignName }) => {
  const client = await pool.connect();

  const {
    rows,
  } = await client.query(
    `SELECT sfid, name FROM ${POSTGRES_SG_TABLE}.Campaign WHERE Name = $1::text`,
    [campaignName.trim()]
  );

  assert(rows.length > 0, "No campaign found");

  const { sfid, name } = rows[0];
  client.release(true);
  return { sfid, name };
};

const UpdateUser = async ({
  contactID,
  statusOfMsg,
  campaignName,
  shortMsg,
  msgId,
}) => {
  try {
    const campaignlookup = await LookupCampaignID({ campaignName });
    assert(campaignlookup.sfid, "No Campaign ID found");
    const { sfid } = campaignlookup;

    const insertMobileSend = `INSERT INTO ${POSTGRES_SG_TABLE}.et4ae5__SMSDefinition__c (et4ae5__Campaign__c, et4ae5__Contact__c, et4ae5__SendStatus__c, et4ae5__Campaigns__c, et4ae5__smsName__c, unique_id__c) VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text)`;

    const client = await pool.connect();

    await client.query(insertMobileSend, [
      sfid,
      contactID,
      statusOfMsg,
      campaignName,
      shortMsg,
      msgId,
    ]);

    client.release(true);
  } catch (error) {
    logger.log({
      level: "info",
      contactID: contactID || "Contact Not Found",
      statusOfMsg,
      campaignName,
      shortMsg,
      msgId,
      ...error,
    });
  }
};

const route = (req, res, next) => {
  req.SFDC = {
    UpdateUser,
  };
  next();
};
module.exports = {
  UpdateUser,
  route,
};

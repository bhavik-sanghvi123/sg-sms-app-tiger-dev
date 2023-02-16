"use strict";
const axios = require("axios");
const assert = require("assert").strict;

assert(process.env.SFMC_OATUH_URL, "Cannot find environment: SFMC_OAUTH_URL");
assert(process.env.SFMC_CLIENT_ID, "Cannot find environment: SFMC_CLIENT_ID");
assert(
  process.env.SFMC_CLIENT_SECRET,
  "Cannot find environment: SFMC_CLIENT_SECRET"
);

const SFAssets = () => {
  const tokenURL = process.env.SFMC_OATUH_URL;
  const client_id = process.env.SFMC_CLIENT_ID;
  const client_secret = process.env.SFMC_CLIENT_SECRET;
  /*
   * Memory storage of access token data.
   */
  let access = {
    access_token: "",
    rest_instance_url: "",
    expires_on: 0,
  };

  /*
   * Function for testing if the token has expired or not
   */
  const has_expired = () => {
    const timenow = new Date().getTime();
    return timenow > access.expires_on ? true : false;
  };

  /*
   * Function for requesting the token.
   * requires: valid token details
   */
  const token = async () => {
    if (has_expired() === false) return access;
    return axios
      .post(tokenURL, {
        grant_type: "client_credentials",
        client_id,
        client_secret,
      })
      .then(({ data }) => {
        const { access_token, rest_instance_url, expires_in } = data;
        access = {
          access_token,
          rest_instance_url,
          expires_on: expires_in * 1000 + new Date().getTime(),
        };

        return access;
      })
      .catch((error) => {
        console.log("TOKEN ERROR >>", error);
      });
  };

  /*
   * Function for requesting the template type.
   * Requires: valid token
   */
  const get_assets = async () => {
    const { access_token, rest_instance_url } = await token();
    const data = {
      query: {
        property: "assetType.name",
        simpleOperator: "equals",
        value: "jsonMessage",
      },
      fields: ["name", "assetType", "views"],
      sort: [
        {
          property: "name",
          direction: "ASC",
        },
      ],
      page: {
        page: 1,
        pageSize: 2500,
      },
    };
    const queryURL = "asset/v1/content/assets/query";

    return axios({
      url: `${rest_instance_url}${queryURL}`,
      method: "post",
      headers: { Authorization: `Bearer ${access_token}` },
      data,
    })
      .then(({ data }) => data)
      .catch((error) => {
        console.log("TOKEN ERROR >>", error);
      });
  };

  /*
   * GET Handler for requesting the template type.
   */
  return async (req, res) => res.json(await get_assets());
};

module.exports = SFAssets();

/*
 * POST Handler for /stop/ route of Activity. doesn't do anything
 */
module.exports = function (req, res) {
  res.status(200).send("Stop");
};

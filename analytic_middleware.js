// Check if session exists for IP in analytic object
// If false, create new session
// If true, check if session should be expired
// --> If expired, close old then create new session
// --> If not expired, update session last action time

const requestIp = require("request-ip");

const { todaysAnalyticObj, createNewSessionAsync } = require("./analytic_main");

module.exports = async function sessionManagement(req, res, next) {
  const { browser, version, os } = req.useragent;

  // const clientIp = requestIp.getClientIp(req); // FOR PROD
  const clientIp = process.env.TEST_IPADDRESS; // FOR DEV

  const existingSession = todaysAnalyticObj.activeSessions.find(
    (item) => item.ip === clientIp
  );

  if (!existingSession) {
    let newSession = await createNewSessionAsync(
      clientIp,
      browser,
      version,
      os
    );

    todaysAnalyticObj.activeSessions.push(newSession);
  } else {
    // console.log("Existing session found");

    let lastAction = existingSession.lastAction;
    let currTime = Date.now();

    if (currTime - lastAction >= 300000) {
      // console.log("Session expired, creating new session...");

      let index = todaysAnalyticObj.activeSessions.indexOf(existingSession);
      let splicedClosedSession = todaysAnalyticObj.activeSessions.splice(
        index,
        1
      );
      splicedClosedSession[0].sessionEndTime = Date.now();
      todaysAnalyticObj.closedSessions.push(splicedClosedSession);

      let newSession = await createNewSessionAsync(
        clientIp,
        browser,
        version,
        os
      );

      todaysAnalyticObj.activeSessions.push(newSession);
    } else {
      // console.log("Session open... Extending");

      existingSession.lastAction = Date.now();
    }
  }

  next();
};

const Reader = require("@maxmind/geoip2-node").Reader;

class DailyAnalyticObj {
  constructor() {
    this.date = Date.now();
    this.activeSessions = [];
    this.closedSessions = [];
    // this.resourceRequests = [];
    this.iplog = [];
    this.countries = [];
  }
  clearFields = () => {
    this.date = Date.now();
    this.activeSessions = [];
    this.closedSessions = [];
    this.iplog = [];
    this.countries = [];
  };
}

const todaysAnalyticObj = new DailyAnalyticObj();

class NewSession {
  constructor(ip, browser, browserVersion, os, country, city, lat, lon) {
    this.sessionStartTime = Date.now();
    this.lastAction = Date.now();

    this.ip = ip;
    this.browser = browser;
    this.browserVersion = browserVersion;
    this.os = os;

    this.sessionRequests = [];

    this.initialScreenWidth = null;
    this.initialScreenHeight = null;
    this.country = country;
    this.city = city;
    this.lat = lat;
    this.lon = lon;

    this.sessionEndTime = null;
  }
}

class SessionResourceRequest {
  constructor(url) {
    this.url = url;
    this.timeRequested = Date.now();
  }
}

class CountryCapture {
  constructor(country) {
    this.country = country;
    this.uniqueHits = 1;
  }
}

const createNewSessionAsync = async (clientIp, browser, version, os) => {
  let country = null;
  let city = null;
  let latitude = null;
  let longitude = null;

  await Reader.open("./GeoLite2-City.mmdb")
    .then((reader) => {
      const response = reader.city(clientIp);

      country = response.country.names.en;
      response.city ? (city = response.city.names.en) : (city = "Not found");
      latitude = response.location.latitude;
      longitude = response.location.longitude;
    })
    .catch((err) => {
      console.log(err);
    });

  if (!todaysAnalyticObj.iplog.find((item) => item === clientIp)) {
    todaysAnalyticObj.iplog.push(clientIp);

    const existingCountryCapture = todaysAnalyticObj.countries.find(
      (item) => item.country === country
    );
    if (!existingCountryCapture) {
      let newCountryCapture = new CountryCapture(country);

      todaysAnalyticObj.countries.push(newCountryCapture);
    } else {
      existingCountryCapture.hits++;
    }
  }

  let newSession = new NewSession(
    clientIp,
    browser,
    version,
    os,
    country,
    city,
    latitude,
    longitude
  );

  return newSession;
};

const logResourceRequest = (clientIp, resource) => {
  // console.log("logResourceRequest called");

  const existingSession = todaysAnalyticObj.activeSessions.find(
    (item) => item.ip === clientIp
  );

  if (existingSession) {
    let newRequest = new SessionResourceRequest(resource);
    existingSession.sessionRequests.push(newRequest);
  }

  // console.log(existingSession);
};

module.exports = {
  NewSession,
  SessionResourceRequest,
  CountryCapture,
  todaysAnalyticObj,
  createNewSessionAsync,
  logResourceRequest,
};

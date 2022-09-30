/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */

const request = require('request');

const fetchMyIP = function(callback) {
  // use request to fetch IP address from JSON API
  request(`https://api.ipify.org/?format=json`, (error, response, body) => {

    // error can be set if invalid domain, user is offline, etc.
    if (error) {
      return callback(error, null);
    }

    // if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    //  to convert the JSON string into an actual object (more specifically an array)
    const data = JSON.parse(body);
    // return the IP address
    return callback(null, data.ip);
  });
};

const fetchCoordsByIP = function(ip, callback) {

  request(`http://ipwho.is/${ip}`, (error, response, body) => {

    if (error) {
      callback(error, null);
      return;
    }

    // parse the returned body so we can check its information
    const parsedBody = JSON.parse(body);
    // check if "success" is true or not
    if (!parsedBody.success) {
      const message = `Success status was ${parsedBody.success}. Server message says: ${parsedBody.message} when fetching for IP ${parsedBody.ip}`;
      callback(Error(message), null);
      return;
    }

    const latitude = parsedBody.latitude;
    const longitude = parsedBody.longitude;
    return callback(null, { latitude, longitude });
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */

const fetchISSFlyOverTimes = function(coordinates, callback) {
  request(`https://iss-flyover.herokuapp.com/json/?lat=${coordinates.latitude}&lon=${coordinates.longitude}`, (error, response, body) => {

    const parsedBody = JSON.parse(body).response;

    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      const message = `Status Code ${response.statusCode} when fetching ISS pass times: ${body}`;
      callback(Error(message), null);
      return;
    }

    return callback(null, parsedBody);
  });
};

const nextISSTimesForMyLocation = function(callback) {

  fetchMyIP((error, ip) => {
    if (error) {
      console.log("It didn't work!", error);
      return callback(error, null);
    }
    console.log('It worked! Returned IP:', ip);
    fetchCoordsByIP(ip, (error, coordinates) => {
      if (error) {
        console.log(error);
        return callback(error, null);
      }
      console.log(`It worked! Returned coordinates: latitude: ${coordinates.latitude}, longitude: ${coordinates.longitude} `);
      fetchISSFlyOverTimes(coordinates, (error, times) => {
        if (error) {
          console.log(error);
          return callback(error, null);
        }
        console.log('It worked! Returned flyover times:', times);
        return callback(null, times);
      });
    });
  });
};

module.exports = { fetchMyIP, fetchCoordsByIP, fetchISSFlyOverTimes, nextISSTimesForMyLocation };


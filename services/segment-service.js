const { Analytics } = require("@segment/analytics-node");
require("dotenv").config();
const axios = require("axios");

const profileToken = process.env.PROFILE_TOKEN;

// instantiation
const analytics = new Analytics({ writeKey: process.env.WRITE_KEY });
const spaceID = process.env.SPACE_ID;

/*
function addEvent(id, ts, order, price, shipment) {
  try {
    analytics.track({
      userId: id,
      event: "Pizza Ordered",
      properties: {
        timestamp: ts,
        order: order,
        price: price,
        shippingMethod: shipment,
      },
    });
  } catch (error) {
    console.error("Error adding addEvent:", error);
  }

  console.log("add addEvent done");
}

function getProfile(id) {
  const username = profileToken;
  const password = "";
  // encode base64
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  // set headers
  const config = {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  };

  console.log("get_profile from segment for id: " + id);

  // HTTP GET
  axios
    .get(
      `https://profiles.segment.com/v1/spaces/${spaceID}/collections/users/profiles/user_id:${id}/traits`,
      config
    )
    .then((response) => {
      const traits = response.data.traits;
      console.log(traits);
      return traits;
    })
    .catch((error) => {
      console.error("get_profile error:", error);
      return "";
    });
}

function getEvents(id) {
  const axios = require("axios");
  const username = profileToken;
  const password = "";
  // encode base64
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  // set headers
  const config = {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  };

  // HTTP GET
  axios
    .get(
      `https://profiles.segment.com/v1/spaces/${spaceID}/collections/users/profiles/user_id:${id}/events`,
      config
    )
    .then((response) => {
      //console.log('Authenticated');
      //console.log(response.data);
      readData(response.data);
    })
    .catch((error) => {
      console.log("Error on Authentication");
      console.error(error);
    });
}

function readData(jsonData) {
  try {
    const result = [];

    jsonData.data.forEach((item) => {
      const extractedData = {
        timestamp: item.properties.timestamp,
        order: item.properties.order,
        // orderID:item.properties.orderID,
        price: item.properties.price,
        shippingMethod: item.properties.shippingMethod,
      };

      result.push(extractedData);
    });

    console.log(result);
  } catch (error) {
    console.error("Error parsing JSON data:", error);
  }
}

*/

//add a user
const addUser = async (id, name, phone) => {
  console.log("add user start");
  try {
    analytics.identify({
      userId: id,
      traits: {
        name: name,
        phone: phone,
      },
    });
  } catch (error) {
    console.error("Error adding user:", error);
  }

  console.log("add user done");
};

const addVirtualAgent = (id, name, prompt, conversationRelayParams) => {
  console.log("add virtual agent start");
  try {
    analytics.identify({
      userId: id,
      traits: {
        name: name,
        prompt: prompt,
        conversationRelayParams: conversationRelayParams,
      },
    });
  } catch (error) {
    console.error("Error adding user:", error);
  }

  console.log("add virtual agent done");
};

const addInteraction = (id, eventName, data) => {
  try {
    analytics.track({
      userId: id,
      event: eventName,
      properties: {
        timestamp: Date.now(),
        data,
      },
    });
  } catch (error) {
    console.error("Error adding addEvent:", error);
  }
};

const getUserProfile = async (id) => {
  const username = profileToken;
  const password = "";
  // encode base64
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  // set headers
  const config = {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  };

  console.log("get_profile from segment for id: " + id);

  try {
    const response = await axios.get(
      `https://profiles.segment.com/v1/spaces/${spaceID}/collections/users/profiles/user_id:${id}/traits`,
      config
    );

    const traits = response.data.traits;
    return traits;
  } catch (e) {
    console.log("get_profile error:", error);
    return "";
  }
};

//to do - GG
const updateUserProfile = async (id) => {
  //
};

module.exports = {
  addUser,
  addVirtualAgent,
  addInteraction,
  getUserProfile,
  updateUserProfile,
};

// addUser('8967', 'john black', '+491234567', 'Berlin Germany');
// addEvent('8967', '2024-10-22', 'Medium eggplant pizza with sausages and AI sauce', 13, 'Delivery');
// getEvents('8967');
// getProfile('8967');

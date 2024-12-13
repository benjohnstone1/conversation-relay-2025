require("colors");
require("dotenv").config();

const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function registerVoiceClient(textService, callSid) {
  try {
    // const client = require("twilio")(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );

    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity: "test:conversationRelay" }
    );

    const grant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });
    accessToken.addGrant(grant);

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    };
    return {
      statusCode: 200,
      headers: headers,
      body: accessToken.toJwt(),
    };
  } catch (err) {
    console.log(err);
  }
}

const getRecording = async (callSid) => {
  try {
    const recordings = await client.recordings.list({
      callSid: callSid,
      limit: 1,
    });

    return {
      accSid: process.env.TWILIO_ACCOUNT_SID,
      recordingSid: recordings[0].sid,
    };
  } catch (e) {
    console.log(e);
    return {
      accSid: process.env.TWILIO_ACCOUNT_SID,
      recordingSid: "",
    };
  }
};

module.exports = { registerVoiceClient, getRecording };

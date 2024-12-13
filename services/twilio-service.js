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

async function recordingService(textService, callSid) {
  try {
    // const client = require("twilio")(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );

    // textService.sendText({partialResponseIndex: null, partialResponse: 'This call will be recorded.'}, 0);
    const recording = await client.calls(callSid).recordings.create({
      recordingChannels: "dual",
    });

    console.log(`Recording Created: ${recording.sid}`.red);
  } catch (err) {
    console.log(err);
  }
}

const getRecording = async (callSid) => {
  return {
    accSid: process.env.TWILIO_ACCOUNT_SID,
    recordingSid: "RE8966843e75f481c87c872b790ddd631f",
  };
};

module.exports = { recordingService, registerVoiceClient, getRecording };

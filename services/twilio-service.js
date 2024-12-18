require("colors");
require("dotenv").config();

const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const startRecording = async (textService, callSid) => {
  try {
    // textService.sendText({partialResponseIndex: null, partialResponse: 'This call will be recorded.'}, 0);
    const recording = await client.calls(callSid).recordings.create({
      recordingChannels: "dual",
    });

    console.log(`Recording Created: ${recording.sid}`.red);
  } catch (err) {
    console.log(err);
  }
};

const registerVoiceClient = async () => {
  try {
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
};

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

module.exports = { registerVoiceClient, getRecording, startRecording };

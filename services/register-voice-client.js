require("colors");
require("dotenv").config();

const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

async function registerVoiceClient(textService, callSid) {
  try {
    const client = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

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

    console.log(accessToken.toJwt());

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    };

    // Include identity and token in a JSON response
    return {
      statusCode: 200,
      headers: headers,
      body: accessToken.toJwt(),
    };
  } catch (err) {
    console.log(err);
  }
}

module.exports = { registerVoiceClient };

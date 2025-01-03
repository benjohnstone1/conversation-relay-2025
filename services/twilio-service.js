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

const registerVoiceClient = async (identity) => {
  try {
    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity: identity || "test:conversationRelay" }
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

const voiceIntelligenceHandler = async (transcriptSid) => {
  console.log("voiceIntelligenceHandler : Twilio Processing" + transcriptSid);

  try {
    // 1. Fetch the Transcript
    const transcriptResponse = await client.intelligence.v2
      .transcripts(transcriptSid)
      .fetch();


    // 2. Fetch the Transcript text      
    let transcriptText = '';

    const sentences = await client.intelligence.v2
      .transcripts(transcriptSid)
      .sentences.list({ limit: 20 });

    sentences.forEach((s) => console.log(s.mediaChannel));

    sentences.forEach((sentence) => { transcriptText = transcriptText + sentence.transcript });
    console.log(transcriptText);

    //3. Get agent, customer profile id
    console.log(transcriptResponse);
    const agent = transcriptResponse.channel.participants.find(p => p.channel_participant === 1); //could also use .role == 'Agent'
    const customer = transcriptResponse.channel.participants.find(p => p.channel_participant === 2); //could also use .role == 'Customer'
    console.log(agent);
    console.log(customer);
    const agentUniqueId = agent.media_participant_id;
    const customerUniqueId = customer.media_participant_id;
    console.log("agent Id " + agentUniqueId);
    console.log("customer Id " + customerUniqueId);


    // 4. Fetch the Operator Results
    const operatorResultsResponse = await client.intelligence.v2
      .transcripts(transcriptSid)
      .operatorResults
      .list();

    //const viOperators = operatorResultsResponse;
    operatorResultsResponse.forEach((o) => { console.log(o.operatorType); });

    const sentimentAnalysisOR = operatorResultsResponse.find(or => or.name === "Sentiment Analysis");
    const sentimentAnalysisVal = sentimentAnalysisOR.predictedLabel;

    console.log("Sentiment analysis " + sentimentAnalysisVal);

    let call = {
      type: "Voice Intelligence Results",
      callSid: transcriptSid, // @TODO get callsid from viTranscript 
      viTranscriptSid: transcriptSid,
      callerProfileId: customerUniqueId,
      agentId: agentUniqueId,
      //viOperators: operatorResultsResponse,
      viOperators: { 'Sentiment Analysis': `'${sentimentAnalysisVal}'`, 'csat': '5', 'contained': 'yes', 'conversion': 'yes' },
      transcript: transcriptText
    };
    return call;
  } catch (error) {
    console.error('Error:', error);
    return ("error");
  }

};

module.exports = { registerVoiceClient, getRecording, startRecording, voiceIntelligenceHandler };

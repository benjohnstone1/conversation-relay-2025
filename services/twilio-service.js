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
      recordingStatusCallback: `https://${process.env.SERVER}/recording-complete`,
      recordingStatusCallbackEvent: ["completed"],
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
      { identity: identity }
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
  console.log(
    "voiceIntelligenceHandler : Twilio Processing - " + transcriptSid
  );

  try {
    // 1. Fetch the Transcript
    const transcriptResponse = await client.intelligence.v2
      .transcripts(transcriptSid)
      .fetch();

    // 2. Fetch the Transcript text
    let transcriptText = "";

    const sentences = await client.intelligence.v2
      .transcripts(transcriptSid)
      .sentences.list({ limit: 20 });

    sentences.forEach((s) => console.log(s.mediaChannel));

    sentences.forEach((sentence) => {
      transcriptText = transcriptText + sentence.transcript;
    });
    console.log(transcriptText);

    //3. Get agent, customer profile id
    console.log(transcriptResponse);
    const agent = transcriptResponse.channel.participants.find(
      (p) => p.role === "Agent"
    );
    const customer = transcriptResponse.channel.participants.find(
      (p) => p.role === "Customer"
    );
    console.log(agent);
    console.log(customer);
    const agentUniqueId = agent.user_id;
    const customerUniqueId = customer.user_id;
    console.log("agent Id " + agentUniqueId);
    console.log("customer Id " + customerUniqueId);

    // 4. Fetch the Operator Results
    const operatorResultsResponse = await client.intelligence.v2
      .transcripts(transcriptSid)
      .operatorResults.list();

    //const viOperators = operatorResultsResponse;
    operatorResultsResponse.forEach((o) => {
      console.log(o.operatorType);
    });

    const sentimentAnalysisOR = operatorResultsResponse.find(
      (or) => or.name === "Sentiment Analysis"
    );
    const sentimentAnalysisVal = sentimentAnalysisOR?.predictedLabel;

    //const competitorReferenceOR = operatorResultsResponse.find(or => or.name === "Competitor References");
    //const competitorReferenceVal =  competitorReferenceOR.predictedLabel ;

    console.log("Sentiment analysis " + sentimentAnalysisVal);

    let call = {
      type: "Voice Intelligence Results",
      callSid: transcriptSid, // @TODO get callsid from viTranscript
      viTranscriptSid: transcriptSid,
      callerProfileId: customerUniqueId,
      agentId: agentUniqueId,
      //viOperators: operatorResultsResponse,
      viOperators: {
        "Sentiment Analysis": `'${sentimentAnalysisVal}'`,
        //, 'Competitor References': `'${competitorReferenceVal}'`
      },
      transcript: transcriptText,
    };
    return call;
  } catch (error) {
    console.error("Error:", error);
    return "error";
  }
};

const fetchCall = async (callSid) => {
  return (call = await client.calls(callSid).fetch());
};

const createTranscript = async (recordingSid, callSid) => {
  try {
    const call = await fetchCall(callSid);
    const participants = [
      {
        user_id: "client:conversationRelay", //specific agent - how do we grab this?
        channel_participant: 2,
        full_name: "client:conversationRelay", //can't get from callSid
        image_url: "https://images.unsplash.com/photo-1554384645-13eab165c24b", //replace or remove image (can add for demo purposes)
        role: "Agent",
      },
      {
        user_id: call.from,
        channel_participant: 1,
        full_name: call.from,
        role: "Customer",
      },
    ];

    const transcript = await client.intelligence.v2.transcripts.create({
      channel: {
        media_properties: {
          source_sid: recordingSid,
        },
        participants: participants,
      },
      serviceSid: process.env.TWILIO_VOICE_INTELLIGENCE_SID,
    });

    return transcript;
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  registerVoiceClient,
  getRecording,
  startRecording,
  createTranscript,
  voiceIntelligenceHandler,
};

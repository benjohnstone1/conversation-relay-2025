const Airtable = require("airtable");
require("dotenv").config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

async function getLatestRecord() {
  try {
    let records = await base("builder")
      .select({
        maxRecords: 1,
        sort: [{ field: "Updated", direction: "desc" }],
      })
      .firstPage();

    if (records.length === 0) {
      throw new Error("No records found");
    }

    let record = records[0];

    let recordObj = {
      conversationRelayParams: {
        dtmfDetection: record.get("dtmfDetection") || false, // undefined if unchecked so set to false
        interruptByDtmf: record.get("interruptByDtmf") || false,
        interruptible: record.get("interruptible") || false,
        language: record.get("Language") || "en-US",
        profanityFilter: record.get("profanityFilter") || false,
        speechModel: record.get("speechModel") || "nova-2-general",
        transcriptionProvider:
          record.get("transcriptionProvider") || "deepgram",
        ttsProvider: record.get("ttsProvider") || "google",
        voice: record.get("Voice") || "en-US-Journey-0",
        welcomeGreeting:
          record.get("welcomeGreeting") || "Hello, how can I help?",
      },
      prompt: record.get("Prompt") || "",
      profile: record.get("User Profile") || "",
      orders: record.get("Orders") || "",
      inventory: record.get("Inventory") || "",
      example: record.get("Example") || "",
      model: record.get("Model") || "",
      changeSTT: record.get("SPIChangeSTT") || false,
      recording: record.get("Recording") || false,
      tools: record.get("tools") || "",
    };
    return recordObj;
  } catch (error) {
    console.error("Error fetching record:", error);
    throw error;
  }
}

async function updateLatestRecord(data) {
  // currently hardcoding recordId = recmlB0LVe3qL30rD
  // make sure to update this
  try {
    let recordObj = {
      dtmfDetection: data.conversationRelayParams.dtmfDetection,
      interruptByDtmf: data.conversationRelayParams.interruptByDtmf,
      interruptible: data.conversationRelayParams.interruptible,
      Language: data.conversationRelayParams.language, //capitolized (consider changing in base)
      profanityFilter: data.conversationRelayParams.profanityFilter,
      speechModel: data.conversationRelayParams.speechModel,
      transcriptionProvider: data.conversationRelayParams.transcriptionProvider,
      ttsProvider: data.conversationRelayParams.ttsProvider,
      Voice: data.conversationRelayParams.voice, //capitolized (consider changing in base)
      welcomeGreeting: data.conversationRelayParams.welcomeGreeting,
      // Prompt: data.prompt, //capitolized (consider changing in base)
      // Inventory: data.inventory,
      // Example: data.example,
      // Model: data.model,
      // SPIChangeSTT: data.changeSTT,
      // Recording: data.recording,
      tools: data.tools,
    };

    let record = await base("builder").update("recmlB0LVe3qL30rD", recordObj);
    console.log("Updated record:", record);
    return {
      status: 200,
    };
  } catch (error) {
    console.error("Error updating record:", error);
    throw error;
  }
}

let data = {
  conversationRelayParams: {
    dtmfDetection: true,
    interruptByDtmf: true,
    interruptible: true,
    language: "en-GB",
    profanityFilter: true,
    speechModel: "nova-2-general",
    transcriptionProvider: "deepgram",
    ttsProvider: "google",
    voice: "en-US-Journey-O",
    welcomeGreeting: "Hello, how can I help?",
  },
  prompt: "",
  inventory: "",
  example: "",
  model: "gpt-4o-2024-08-06",
  changeSTT: false,
  recording: false,
  tools: "",
};

module.exports = { base, getLatestRecord, updateLatestRecord };

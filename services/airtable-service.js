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

    console.log(recordObj.conversationRelayParams.profanityFilter);
    return recordObj;
  } catch (error) {
    console.error("Error fetching record:", error);
    throw error;
  }
}
getLatestRecord();

module.exports = { base, getLatestRecord };

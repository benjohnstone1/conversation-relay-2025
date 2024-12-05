const Airtable = require("airtable");
require("dotenv").config({ path: "../.env" });

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
        dtmfDetection: true, //add
        interruptByDtmf: true, //add
        interruptible: true, //add
        language: record.get("Language") || "en-US",
        profanityFilter: true, // add
        speechModel: "nova-2-general", //add
        transcriptionProvider:
          record.get("transcriptionProvider") || "deepgram",
        ttsProvider: "google", //add
        voice: record.get("Voice") || "",
        welcomeGreeting: "Hello it's Ben!", // add
      },
      prompt: record.get("Prompt") || "",
      profile: record.get("User Profile") || "",
      orders: record.get("Orders") || "",
      inventory: record.get("Inventory") || "",
      example: record.get("Example") || "",
      model: record.get("Model") || "",
      changeSTT: record.get("SPIChangeSTT") || false,
      recording: record.get("Recording") || false,
      tools: "", //add
    };
    return recordObj;
  } catch (error) {
    console.error("Error fetching record:", error);
    throw error;
  }
}

module.exports = { base, getLatestRecord };

const Airtable = require("airtable");
require("dotenv").config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

async function getRecordByTitle(data) {
  try {
    let records = await base("builder")
      .select({
        maxRecords: 1,
        sort: [{ field: "Updated", direction: "desc" }],
        filterByFormula: `{Title} = "${data.title}"`,
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
      title: record.get("Title"),
      brevity: record.get("Brevity") || 0,
      formality: record.get("Formality") || 0,
      rizz: record.get("Rizz") || 0,
      genZ: record.get("GenZ") || 0,
      grumpiness: record.get("Grumpiness") || 0,
      pirate: record.get("Pirate") || 0,
    };
    return recordObj;
  } catch (error) {
    console.error("Error fetching record:", error);
    throw error;
  }
}

async function getLatestRecords() {
  try {
    let records = await base("builder")
      .select({
        // maxRecords: 1,
        sort: [{ field: "Title", direction: "asc" }],
      })
      .firstPage();

    if (records.length === 0) {
      throw new Error("No records found");
    }
    let recArr = [];
    for (var i = 0; i < records.length; i++) {
      let recordObj = {
        conversationRelayParams: {
          dtmfDetection: records[i].get("dtmfDetection") || false, // undefined if unchecked so set to false
          interruptByDtmf: records[i].get("interruptByDtmf") || false,
          interruptible: records[i].get("interruptible") || false,
          language: records[i].get("Language") || "en-US",
          profanityFilter: records[i].get("profanityFilter") || false,
          speechModel: records[i].get("speechModel") || "nova-2-general",
          transcriptionProvider:
            records[i].get("transcriptionProvider") || "deepgram",
          ttsProvider: records[i].get("ttsProvider") || "google",
          voice: records[i].get("Voice") || "en-US-Journey-0",
          welcomeGreeting:
            records[i].get("welcomeGreeting") || "Hello, how can I help?",
        },
        prompt: records[i].get("Prompt") || "",
        profile: records[i].get("User Profile") || "",
        orders: records[i].get("Orders") || "",
        inventory: records[i].get("Inventory") || "",
        example: records[i].get("Example") || "",
        model: records[i].get("Model") || "",
        changeSTT: records[i].get("SPIChangeSTT") || false,
        recording: records[i].get("Recording") || false,
        tools: records[i].get("tools") || "",
        title: records[i].get("Title"),
        brevity: records[i].get("Brevity") || 0,
        formality: records[i].get("Formality") || 0,
        rizz: records[i].get("Rizz") || 0,
        genZ: records[i].get("GenZ") || 0,
        grumpiness: records[i].get("Grumpiness") || 0,
        pirate: records[i].get("Pirate") || 0,
      };
      recArr.push(recordObj);
    }
    return recArr;
  } catch (error) {
    console.error("Error fetching record:", error);
    throw error;
  }
}

async function updateLatestRecord(data) {
  try {
    // Find recordId by Title
    let records = await base("builder")
      .select({
        maxRecords: 1,
        sort: [{ field: "Updated", direction: "desc" }],
        filterByFormula: `{Title} = "${data.title}"`,
      })
      .firstPage();

    // Create record object update
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
      // brevity: data.conversationRelayParams.brevity,
      // formality: data.conversationRelayParams.formality,
      // rizz: data.conversationRelayParams.rizz,
      // genZ: data.conversationRelayParams.genZ,
      // grumpiness: data.conversationRelayParams.grumpiness,
      // pirate: rdata.conversationRelayParams.pirate,
      // Prompt: data.prompt, //capitolized (consider changing in base)
      // Inventory: data.inventory,
      // Example: data.example,
      // Model: data.model,
      // SPIChangeSTT: data.changeSTT,
      // Recording: data.recording,
      tools: data.tools,
    };

    let record = await base("builder").update(records[0].id, recordObj);
    console.log("Updated record:", records[0].id);
    return {
      status: 200,
    };
  } catch (error) {
    console.error("Error updating record:", error);
    throw error;
  }
}

// Sample data
// let data = {
//   conversationRelayParams: {
//     dtmfDetection: true,
//     interruptByDtmf: true,
//     interruptible: true,
//     language: "en-GB",
//     profanityFilter: true,
//     speechModel: "nova-2-general",
//     transcriptionProvider: "deepgram",
//     ttsProvider: "google",
//     voice: "en-US-Journey-O",
//     welcomeGreeting: "Hello, how can I help?",
//   },
//   prompt: "",
//   inventory: "",
//   example: "",
//   model: "gpt-4o-2024-08-06",
//   changeSTT: false,
//   recording: false,
//   tools: "",
//   title: "Owl Shoes ISV Summit SF",
// };

module.exports = {
  base,
  updateLatestRecord,
  getLatestRecords,
  getRecordByTitle,
};

require("dotenv").config();
require("colors");
require("log-timestamp");

const express = require("express");
const ExpressWs = require("express-ws");
const cors = require("cors");
const path = require("path");

const { GptService } = require("./services/gpt-service");
const { TextService } = require("./services/text-service");
const { recordingService } = require("./services/recording-service");
const { registerVoiceClient } = require("./services/register-voice-client");
const { prompt, userProfile, orderHistory } = require("./services/prompt");
const {
  getLatestRecords,
  updateLatestRecord,
  getRecordByTitle,
} = require("./services/airtable-service");

const app = express();
ExpressWs(app);

const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "./visibility-app/build")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Declare global variable
let gptService;
let textService;
let records;
// Add this code after creating the Express app

// Handled by our React App
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./visibility-app/build", "index.html"));
});

app.get("/monitor", (req, res) => {
  res.sendFile(__dirname + "/monitor.html");
});

// Initialize an array to store logs
const logs = [];

// Method to add logs
function addLog(level, message) {
  console.log(message);
  const timestamp = new Date().toISOString();
  logs.push({ timestamp, level, message });
}

// Route to retrieve logs
app.get("/logs", (req, res) => {
  res.json(logs);
});

// Route to retrieve Airtable records
app.get("/get-use-cases", async (req, res) => {
  records = await getLatestRecords();
  res.json(records);
});

// Route to update Airtable record
app.post("/update-use-cases", async (req, res) => {
  console.log("Updating record: ", req.body.title);
  updatedRecord = await updateLatestRecord(req.body);
  res.send(updatedRecord);
});

// Route to register voice client
app.get("/register-voice-client", async (req, res) => {
  token = await registerVoiceClient();
  console.log("Registered voice client");
  res.send(token.body);
});

app.post("/incoming", async (req, res) => {
  try {
    logs.length = 0; // Clear logs
    addLog("info", "incoming call started");
    // Get latest record from airtable
    console.log("Title is ", req.body.Title);
    record = await getRecordByTitle({ title: req.body.Title });

    // Initialize GPT service
    gptService = new GptService(record.model, wsClient);
    gptService.userContext.push({ role: "system", content: record.prompt });
    gptService.userContext.push({ role: "system", content: record.profile });
    gptService.userContext.push({ role: "system", content: record.orders });
    gptService.userContext.push({ role: "system", content: record.inventory });
    gptService.userContext.push({ role: "system", content: record.example });
    gptService.userContext.push({
      role: "system",
      content: `You can speak in many languages, but use default language ${record.conversationRelayParams.language} for this conversation from now on! Remember it as the default language, even you change language in between. treat en-US and en-GB etc. as different languages.`,
    });

    addLog(
      "info",
      `language : ${record.conversationRelayParams.language}, voice : ${record.conversationRelayParams.voice}, profanityFilter : ${record.conversationRelayParams.profanityFilter}`
    );

    const response = `<Response>
      <Connect>
        <ConversationRelay url="wss://${process.env.SERVER}/sockets" dtmfDetection="${record.conversationRelayParams.dtmfDetection}" interruptible="${record.conversationRelayParams.interruptible}" voice="${record.conversationRelayParams.voice}" language="${record.conversationRelayParams.language}" profanityFilter="${record.conversationRelayParams.profanityFilter}" speechModel="${record.conversationRelayParams.speechModel}" transcriptionProvider="${record.conversationRelayParams.transcriptionProvider}" ttsProvider="${record.conversationRelayParams.ttsProvider}" welcomeGreeting="${record.conversationRelayParams.welcomeGreeting}">
        </ConversationRelay>
      </Connect>
    </Response>`;
    res.type("text/xml");
    res.end(response.toString());
  } catch (err) {
    console.log(err);
  }
});

function sendEventToClient(ws, msg) {
  console.log(msg);
  ws.send(JSON.stringify(msg));
}

let wsClient;

app.ws("/clientSocket", (ws) => {
  console.log("WebSocket connection established");
  wsClient = ws;

  ws.on("message", (msg) => {
    console.log("received message: ", msg);
    let data = JSON.parse(msg);

    if (data.type === "setup") {
      let data = {
        type: "setup",
        token: Date.now(), //update token to
      };
      ws.send(JSON.stringify(data));
    }
  });

  ws.on("ping", () => {
    console.log("ping received");
  });

  ws.on("error", (err) => {
    console.log("WebSocket error: {}", err);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    // removeWsConn(ws);
  });
});

app.ws("/sockets", (ws) => {
  try {
    ws.on("error", console.error);
    // Filled in from start message
    let callSid;

    textService = new TextService(ws);

    let interactionCount = 0;

    // Incoming from MediaStream
    ws.on("message", function message(data) {
      const msg = JSON.parse(data);
      console.log(msg);
      // Send conversation relay message to client websocket
      sendEventToClient(wsClient, msg);
      if (msg.type === "setup") {
        addLog("convrelay", `convrelay socket setup ${msg.callSid}`);
        callSid = msg.callSid;
        // to do - confirm if number is needed as calling from client
        gptService.setCallInfo("user phone number", msg.from);

        //trigger gpt to start
        // gptService.completion("hello", interactionCount);

        interactionCount += 1;
        if (record.recording) {
          recordingService(textService, callSid).then(() => {
            console.log(
              `Twilio -> Starting recording for ${callSid}`.underline.red
            );
          });
        }
      }

      if (msg.type === "prompt") {
        addLog(
          "convrelay",
          `convrelay -> GPT (${msg.lang}) :  ${msg.voicePrompt} `
        );
        gptService.completion(msg.voicePrompt, interactionCount);
        interactionCount += 1;
      }

      if (msg.type === "interrupt") {
        sendEventToClient(wsClient, msg);
        addLog(
          "convrelay",
          "convrelay interrupt: utteranceUntilInterrupt: " +
            msg.utteranceUntilInterrupt +
            " durationUntilInterruptMs: " +
            msg.durationUntilInterruptMs
        );
        gptService.interrupt();
        // console.log('Todo: add interruption handling');
      }

      if (msg.type === "error") {
        addLog("convrelay", "convrelay error: " + msg.description);

        console.log("Todo: add error handling");
      }

      if (msg.type === "dtmf") {
        addLog("convrelay", "convrelay dtmf: " + msg.digit);

        console.log("Todo: add dtmf handling");
      }
    });

    gptService.on("gptreply", async (gptReply, final, icount) => {
      console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply}`.green);
      //addLog('info', gptReply);
      addLog("gpt", `GPT -> convrelay: Interaction ${icount}: ${gptReply}`);

      let msg = {
        type: "text",
        token: gptReply,
      };

      sendEventToClient(wsClient, msg);
      textService.sendText(gptReply, final);
    });

    gptService.on(
      "tools",
      async (functionName, functionArgs, functionResponse) => {
        addLog("gpt", `Function ${functionName} with args ${functionArgs}`);
        addLog("gpt", `Function Response: ${functionResponse}`);

        if (functionName == "changeLanguage" && record.changeSTT) {
          addLog("convrelay", `convrelay ChangeLanguage to: ${functionArgs}`);
          let jsonObj = JSON.parse(functionArgs);
          textService.setLang(jsonObj.language);
          // gptService.userContext.push({ 'role': 'assistant', 'content':`change Language to ${functionArgs}`});
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT);
console.log(`Server running on port ${PORT}`);

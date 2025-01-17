require("dotenv").config();
require("colors");
require("log-timestamp");

const express = require("express");
const ExpressWs = require("express-ws");
const cors = require("cors");
const path = require("path");

const { GptService } = require("./services/gpt-service");
const { TextService } = require("./services/text-service");
const {
  addUser,
  addVirtualAgent,
  addInteraction,
  getUserProfile,
} = require("./services/segment-service");
const {
  registerVoiceClient,
  getRecording,
  startRecording,
  createTranscript,
  voiceIntelligenceHandler,
} = require("./services/twilio-service");
// const { prompt, userProfile, orderHistory } = require("./services/prompt");
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
  const phone = req.query.phone;
  const identity = phone.replace(" ", "+"); //quirk passing in from UI
  token = await registerVoiceClient(identity);
  console.log("Registered voice client");
  res.send(token.body);
});

// Voice Intelligence Handler
app.post("/voice-intelligence-handler", async (req, res) => {
  try {
    const params = req.body;
    console.log("voice-intelligence-handler start");
    console.log(params);
    const transcriptSid = params.transcript_sid;
    viResult = await voiceIntelligenceHandler(transcriptSid);
    console.log("voice-intelligence-handler complete result: " + viResult);
    // we also need to update the transcript particpants

    // add to segment
    addInteraction(
      viResult.callerProfileId,
      viResult.type,
      viResult
    );
    
    //@TODO ask andy how we add the same event to caller and agent
    //addInteraction(call.agentId, `${call.type}: ${call.callSid}`, call);
    res.send("success");
  } catch (err) {
    console.log("error sending call to segment " + err);
    res.send("error");
  }
});

// Post Recording Handler
app.post("/recording-complete", async (req, res) => {
  console.log("recording completed - creating transcript");
  const transcript = await createTranscript(
    req.body.RecordingSid,
    req.body.CallSid
  );
  console.log("transcript created", transcript);
});

// Get Recording
app.get("/get-recording", async (req, res) => {
  const callSid = req.query.callSid;
  recording = await getRecording(callSid);
  console.log(recording);
  res.send(recording);
});

app.post("/incoming", async (req, res) => {
  try {
    logs.length = 0; // Clear logs
    addLog("info", "incoming call started");
    // Get Record from Airtable by Title
    record = await getRecordByTitle({
      title: req.body.Title || "Owl Shoes ISV Summit SF",
    });

    // Trigger Segment identity
    let user = req.body.From; // e.g. "client:+1647XXXXXX"
    const phone = user.replace("client:", "");
    addUser(user, phone);
    // const userId = user.replace(/\+/g, "%2B").replace(/:/g, "%3A"); //need to reformat to pull from segment
    const profile = await getUserProfile(user);
    console.log(`profile returned: ${JSON.stringify(profile)}`.yellow);

    // add virtual agent
    addVirtualAgent(
      record.title, //id
      record.title, //name
      record.prompt,
      record.conversationRelayParams
    );

    // Initialize GPT service
    gptService = new GptService(record.model, wsClient);
    // Replace Airtable records with data from Segment
    gptService.userContext.push({ role: "system", content: record.prompt });
    // gptService.userContext.push({ role: "system", content: record.profile }); //Airtable
    gptService.userContext.push({
      role: "system",
      content: JSON.stringify(profile),
    });
    gptService.userContext.push({ role: "system", content: record.orders }); //replace with Segment order history
    gptService.userContext.push({ role: "system", content: record.inventory });
    // gptService.userContext.push({ role: "system", content: record.example }); //this was empty commenting out for now
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
        <Parameter name="foo" value="bar"/>
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
  if (ws) {
    ws.send(JSON.stringify(msg));
  }
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
    let caller;

    // Incoming from MediaStream
    ws.on("message", function message(data) {
      const msg = JSON.parse(data);
      console.log(msg);
      // Send conversation relay message to client websocket
      sendEventToClient(wsClient, msg);
      if (caller) {
        console.log(`${caller}`.green);
        if (msg.type === "setup") {
          console.log(`cRelay Message: ${msg.type}`.green);
          addInteraction(caller, `cRelay Message: ${msg.type}`, msg);
        }
      }

      // Handle conversation relay message types
      if (msg.type === "setup") {
        addLog("convrelay", `convrelay socket setup ${msg.callSid}`);
        callSid = msg.callSid;
        caller = msg.from;
        addInteraction(caller, `cRelay Message: ${msg.type}`, msg);

        // to do - confirm if number is needed as calling from client
        gptService.setCallInfo("user phone number", msg.from);

        //trigger gpt to start
        // gptService.completion("hello", interactionCount);

        interactionCount += 1;
        if (record.recording) {
          startRecording(textService, callSid).then(() => {
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
        addLog(
          "convrelay",
          "convrelay interrupt: utteranceUntilInterrupt: " +
            msg.utteranceUntilInterrupt +
            " durationUntilInterruptMs: " +
            msg.durationUntilInterruptMs
        );
        gptService.interrupt();
      }

      if (msg.type === "error") {
        addLog("convrelay", "convrelay error: " + msg.description);
        addInteraction(caller, `cRelay Message: ${msg.type}`, msg);
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
      // addInteraction(caller, `Message: ${msg.type}`, msg);
      textService.sendText(gptReply, final);
    });

    gptService.on(
      "tools",
      async (functionName, functionArgs, functionResponse) => {
        addLog("gpt", `Function ${functionName} with args ${functionArgs}`);
        addLog("gpt", `Function Response: ${functionResponse}`);

        let msg = {
          type: "functionCall",
          token: `Called function ${functionName} with args ${functionArgs}`,
        };
        sendEventToClient(wsClient, msg);

        // Add function call to Segment
        addInteraction(caller, `${msg.type}: ${functionName}`, msg);

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

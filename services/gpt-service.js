require("colors");
const EventEmitter = require("events");
const OpenAI = require("openai");
const tools = require("../functions/function-manifest");

// const { prompt, userProfile, orderHistory } = require("./prompt");

// Import all functions included in function manifest
// Note: the function name and file name must be the same
const availableFunctions = {};

tools.forEach((tool) => {
  let functionName = tool.function.name;
  availableFunctions[functionName] = require(`../functions/${functionName}`);
  console.log(`load function: ${functionName}`);
});

class GptService extends EventEmitter {
  constructor(model = "gpt-4o") {
    super();
    this.openai = new OpenAI();
    this.model = model; // Initialize model here
    (this.userContext = [
      // { 'role': 'system', 'content': prompt },
      // { 'role': 'system', 'content': userProfile },
      // { 'role': 'system', 'content': 'You should speak English as default, and forget previous conversations' },
      // {
      //   role: "assistant",
      //   content: "Hello! Welcome to Owl Shoes, how can i help you today",
      // },
    ]),
      (this.partialResponseIndex = 0);
    this.isInterrupted = false;

    console.log(`GptService init with model: ${this.model}`);
  }

  // Add the callSid to the chat context in case
  // ChatGPT decides to transfer the call.
  setCallInfo(info, value) {
    console.log("setCallInfo", info, value);
    this.userContext.push({ role: "user", content: `${info}: ${value}` });
  }

  interrupt() {
    this.isInterrupted = true;
  }

  validateFunctionArgs(args) {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log(
        "Warning: Double function arguments returned by OpenAI:",
        args
      );
      // Seeing an error where sometimes we have two sets of args
      if (args.indexOf("{") != args.lastIndexOf("{")) {
        return JSON.parse(
          args.substring(args.indexOf(""), args.indexOf("}") + 1)
        );
      }
    }
  }

  updateUserContext(name, role, text) {
    // console.log('updateUserContext: ', name, role, text)
    if (name !== "user") {
      this.userContext.push({ role: role, name: name, content: text });
    } else {
      this.userContext.push({ role: role, content: text });
    }
  }

  async completion(text, interactionCount, role = "user", name = "user") {
    console.log("GptService completion: ", role, name, text);
    this.isInterrupted = false;
    this.updateUserContext(name, role, text);

    // Step 1: Send user transcription to Chat GPT
    let stream = await this.openai.chat.completions.create({
      model: this.model,
      messages: this.userContext,
      tools: tools,
      stream: true,
      temperature: 0.5,
    });

    let completeResponse = "";
    let partialResponse = "";
    let functionName = "";
    let functionArgs = "";
    let finishReason = "";

    function collectToolInformation(deltas) {
      let name = deltas.tool_calls[0]?.function?.name || "";
      if (name != "") {
        functionName = name;
      }
      let args = deltas.tool_calls[0]?.function?.arguments || "";
      if (args != "") {
        // args are streamed as JSON string so we need to concatenate all chunks
        functionArgs += args;
      }
      console.log("collectToolInformation", functionName, functionArgs);
    }

    for await (const chunk of stream) {
      if (this.isInterrupted) {
        break;
      }

      let content = chunk.choices[0]?.delta?.content || "";
      let deltas = chunk.choices[0].delta;
      finishReason = chunk.choices[0].finish_reason;

      // Step 2: check if GPT wanted to call a function
      if (deltas.tool_calls) {
        // Step 3: Collect the tokens containing function data
        collectToolInformation(deltas);
      }

      // need to call function on behalf of Chat GPT with the arguments it parsed from the conversation
      if (finishReason === "tool_calls") {
        // parse JSON string of args into JSON object

        const functionToCall = availableFunctions[functionName];
        const validatedArgs = this.validateFunctionArgs(functionArgs);
        console.log("validatedArgs", validatedArgs);

        // Say a pre-configured message from the function manifest
        // before running the function.
        const toolData = tools.find(
          (tool) => tool.function.name === functionName
        );
        const say = toolData.function.say;

        this.emit("gptreply", say, false, interactionCount);

        let functionResponse = await functionToCall(validatedArgs);
        // if (functionName === "getOrder") {
        //   this.userContext.push(
        //     "system",
        //     `The customers order details are the following ${functionResponse} use this order object when sending SMS confirmation`
        //   );
        // }

        // console.log('functionResponse', functionResponse)
        this.emit(
          "tools",
          functionName,
          JSON.stringify(validatedArgs), //changed from functionArgs
          functionResponse
        );

        // Step 4: send the info on the function call and function response to GPT
        this.updateUserContext(functionName, "function", functionResponse);

        // call the completion function again but pass in the function response to have OpenAI generate a new assistant response
        await this.completion(
          functionResponse,
          interactionCount,
          "function",
          functionName
        );
      } else {
        // We use completeResponse for userContext
        completeResponse += content;
        // We use partialResponse to provide a chunk for TTS
        partialResponse += content;

        // console.log('partialResponse', partialResponse);
        // console.log('completeResponse', completeResponse);

        if (finishReason === "stop") {
          this.emit("gptreply", partialResponse, true, interactionCount);
          console.log("emit gptreply stop");
        } else {
          this.emit("gptreply", partialResponse, false, interactionCount);
          // console.log('emit gptreply partialResponse', partialResponse);
          partialResponse = "";
        }
      }
    }
    this.userContext.push({ role: "assistant", content: completeResponse });
    console.log(`GPT -> user context length: ${this.userContext.length}`.green);
  }
}

module.exports = { GptService };

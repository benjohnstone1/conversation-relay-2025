// create metadata for all the available functions to pass to completions API
const tools = [
  {
    type: "function",
    function: {
      name: "placeOrder",
      say: "All right, I'm just going to ring that up in our system.",
      description:
        "Places an order for a set of shoes, after double confirmed with the customer.",
      parameters: {
        type: "object",
        properties: {
          order: {
            type: "string",
            description:
              "The order summary including model of shoes, price, shipping method and information",
          },
          number: {
            type: "string",
            description: "The user phone number in E.164 format",
          },
        },
        required: ["order", "number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get the current weather for a given location.",
      say: "Let me check the weather for you.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city name (e.g., London, Paris).",
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "changeLanguage",
      description:
        "Change the current conversation language to user preference, treat en-US, en-GB, es-ES, es-MX etc. as different languages.",
      parameters: {
        type: "object",
        properties: {
          language: {
            type: "string",
            description:
              "The language codes preferred by the user and should be changed to, the format like en-US, fr-FR etc. If the user requests language without specifying the region, default to the system's initial language with region if they are the same.",
          },
        },
        required: ["language"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateSegmentProfile",
      description:
        "Update the user profile in segment with the new trait values for example when someone says their shoe size is different from what you were expecting",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "the user id which will be passed in from the call",
          },
          traitName: {
            type: "string",
            description: "the name of the trait that needs to be updated",
          },
          traitValue: {
            type: "string",
            description: "the value of the trait the need to be updated",
          },
        },
        required: ["id", "traitName", "traitValue"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendSMSOrderConfirmation",
      description: "Send an SMS containing details about the order",
      say: "Sure thing, sendign an SMS confirmation now.",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "string",
            description: "the phone number of the caller",
          },
          order: {
            type: "string",
            description: "the latest order from the caller",
          },
        },
        required: ["number", "order"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrder",
      description: "Check what food items were ordered",
      say: "No problem I'll take a look at that now",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "string",
            description: "the phone number of the caller",
          },
          order: {
            type: "string",
            description: "the latest order from the caller",
          },
        },
        required: ["number", "order"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkOrderDeliveryTime",
      description: "Check the estimated order delivery time",
      say: "Let me check the estimated delivery time",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "string",
            description: "the phone number of the caller",
          },
          order: {
            type: "string",
            description: "the latest order from the caller",
          },
        },
        required: ["number", "order"],
      },
    },
  },
];

module.exports = tools;

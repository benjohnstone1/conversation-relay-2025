// create metadata for all the available functions to pass to completions API
const tools = [
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
          units: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description:
              "Units the temperature will be returned in. Always ask the user to confirm which units",
          },
        },
        required: ["location", "units"],
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
        "Update the user profile in segment with the new trait values for example when someone says their name is different from what you were expecting you should offer to update this for them",
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
      name: "getOrder",
      description:
        "Retrieve the last order someone has placed you should prioritize this function call above checking the delivery time if they have not retrieved the order yet",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "string",
            description: "the phone number of the caller",
          },
        },
        required: ["number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkOrderDeliveryTime",
      description:
        "Get the estimated order delivery time only call this function when someone is looking to understand when their order will be delivered",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "string",
            description: "the phone number of the caller",
          },
          // order: {
          //   type: "object",
          //   description:
          //     "this an order if you don't already have this information you'll need to retrieve it first",
          // },
        },
        required: ["number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendSMSOrderConfirmation",
      description:
        "Send an SMS containing details about the last order that was place you must make sure to get the order information and the estimed delivery time before attempting to send an sms message, you must also confirm they actually want to receive the SMS message before sending",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "string",
            description: "the phone number of the caller",
          },
          firstName: {
            type: "string",
            description: "first name of the caller",
          },
          orderProduct: {
            type: "string",
            description: "${order?.products[0]?.name}",
          },
          orderId: {
            type: "string",
            description: "${order?.orderID}",
          },
          deliveryTime: {
            type: "string",
            description:
              "this is the expected delivery time for the order do not guess this time make sure you know the delivery time",
          },
        },
        required: [
          "number",
          "firstName",
          "orderId",
          "orderProduct",
          "deliveryTime",
        ],
      },
    },
  },
];

module.exports = tools;

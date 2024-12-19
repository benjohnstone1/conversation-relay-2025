// create metadata for all the available functions to pass to completions API
const tools = [
  // {
  //   type: 'function',
  //   function: {
  //     name: 'checkInventory',
  //     say: 'Let me check our inventory right now.',
  //     description: 'Check the inventory of airpods, airpods pro or airpods max.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         model: {
  //           type: 'string',
  //           'enum': ['airpods', 'airpods pro', 'airpods max'],
  //           description: 'The model of airpods, either the airpods, airpods pro or airpods max',
  //         },
  //       },
  //       required: ['model'],
  //     },
  //     returns: {
  //       type: 'object',
  //       properties: {
  //         stock: {
  //           type: 'integer',
  //           description: 'An integer containing how many of the model are in currently in stock.'
  //         }
  //       }
  //     }
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: 'checkPrice',
  //     say: 'Let me check the price, one moment.',
  //     description: 'Check the price of given model of airpods, airpods pro or airpods max.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         model: {
  //           type: 'string',
  //           'enum': ['airpods', 'airpods pro', 'airpods max'],
  //           description: 'The model of airpods, either the airpods, airpods pro or airpods max',
  //         },
  //       },
  //       required: ['model'],
  //     },
  //     returns: {
  //       type: 'object',
  //       properties: {
  //         price: {
  //           type: 'integer',
  //           description: 'the price of the model'
  //         }
  //       }
  //     }
  //   },
  // },
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

  // {
  //   type: 'function',
  //   function: {
  //     name: 'transferCall',
  //     say: 'One moment while I transfer your call.',
  //     description: 'Transfers the customer to a live agent in case they request help from a real person.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         callSid: {
  //           type: 'string',
  //           description: 'The unique identifier for the active phone call.',
  //         },
  //       },
  //       required: ['callSid'],
  //     },
  //     returns: {
  //       type: 'object',
  //       properties: {
  //         status: {
  //           type: 'string',
  //           description: 'Whether or not the customer call was successfully transfered'
  //         },
  //       }
  //     }
  //   },
  // },

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
      // say: 'Let me check the weather for you.',
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
      // say: 'Let me check the weather for you.',
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
];

module.exports = tools;

const twilio = require("twilio");
require("dotenv").config();

async function sendSMSOrderConfirmation(functionArgs) {
  const order = functionArgs.order; // where do we get this order number?
  const number = functionArgs.number; // we already have this
  console.log("GPT -> called placeOrder function: ", order);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  // generate a random order number that is 7 digits
  const orderNum = Math.floor(
    Math.random() * (9999999 - 1000000 + 1) + 1000000
  );

  // await new Promise(resolve => setTimeout(resolve, 3000));

  // Send SMS using Twilio
  client.messages
    .create({
      body: `Your order number is ${orderNum}, and the details: ${order}`,
      from: process.env.FROM_NUMBER,
      to: number,
    })
    .then((message) => console.log(message.sid))
    .catch((err) => console.error(err));

  return JSON.stringify({
    orderNumber: orderNum,
    message: "the order is confirmed in the system.",
  });
}

module.exports = sendSMSOrderConfirmation;

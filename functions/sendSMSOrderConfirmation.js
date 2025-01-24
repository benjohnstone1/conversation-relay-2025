const twilio = require("twilio");
require("dotenv").config();

async function sendSMSOrderConfirmation(functionArgs) {
  const order = functionArgs.order; // where do we get this order number?
  const number = functionArgs.number;
  const firstName = functionArgs.firstName;
  const deliveryTime = functionArgs.deliveryTime;
  const orderProduct = functionArgs.orderProduct;
  const orderId = functionArgs.orderId;
  const orderValue = functionArgs.orderValue;

  console.log("GPT -> called sendSMSOrderConfirmation function: ", order);

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
      body: `Hi ${firstName}, your order number is ${orderId}, you ordered the ${orderProduct} & it is expected to arrive in ${deliveryTime}. Enjoy!`,
      from: process.env.FROM_NUMBER,
      to: number,
    })
    .then((message) => console.log(message.sid))
    .catch((err) => console.error(err));

  return JSON.stringify({
    message: "we have sent the sms confirmation with details of the delivery",
  });
}

module.exports = sendSMSOrderConfirmation;

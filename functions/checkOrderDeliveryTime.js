async function checkOrderDeliveryTime(functionArgs) {
  console.log("GPT -> called checkOrderDeliveryTime function", functionArgs);

  // Random delivery time between 1-60 minutes
  const deliveryTime = Math.floor(Math.random() * (60 - 1) + 1);

  console.log(deliveryTime);

  return JSON.stringify({
    deliveryTime: deliveryTime,
    message:
      "provide details of the estimated order delivery time and offer to send an sms confirmation with the details",
  });
}

module.exports = checkOrderDeliveryTime;

let sampleOrder1 = {
  orderID: 1737392508,
  hot: 1,
  pants: 0,
  shirts: 0,
  contents: [["0001", 1]],
  products: [
    {
      SKU: "0001",
      name: "Chicken Shawarma",
      description: "Delicious",
      category: "hot",
      subCategory: "sandwiches",
      protein: "chicken",
      priceUSD: 14.99,
      image: "chicken-shawarma.jpg",
    },
  ],
  quantity: 1,
  value: 14.99,
};
let sampleOrder2 = {
  orderID: 1837392531,
  hot: 0,
  pants: 0,
  shirts: 0,
  contents: [["0002", 1]],
  products: [
    {
      SKU: "0001",
      name: "Poutine",
      description: "Smashing",
      category: "tasty",
      subCategory: "fries",
      protein: "cheese",
      priceUSD: 12.89,
      image: "poutine.jpg",
    },
  ],
  quantity: 1,
  value: 12.89,
};
let sampleOrder3 = {
  orderID: 1937392512,
  hot: 1,
  pants: 0,
  shirts: 0,
  contents: [["0001", 1]],
  products: [
    {
      SKU: "0003",
      name: "Tacos",
      description: "Glorious",
      category: "hot",
      subCategory: "tacos",
      protein: "beef",
      priceUSD: 18.29,
      image: "beef-tacos.jpg",
    },
  ],
  quantity: 1,
  value: 18.29,
};
let orderHistory = [sampleOrder1, sampleOrder2, sampleOrder3];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function getOrder(functionArgs) {
  const number = functionArgs.number;
  console.log("GPT -> called checkOrderProducts function");

  // Select random order
  whichOrder = getRandomInt(3);

  return JSON.stringify({
    order: orderHistory[whichOrder],
    message:
      "let the customer know what products they ordered and ask if they would like to know the estimated delivery time",
  });
}

module.exports = getOrder;

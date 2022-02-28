const axios = require("axios");

exports.handler = async function (context, event, callback) {
  const response = await axios.post(
    "https://api.monday.com/v2",
    {
      query: "query { boards(limit: 100) { name } }",
    },
    {
      headers: {
        Authorization: context.monday_token,
        "Content-Type": "application/json",
      },
    }
  );
  let message = "Bun venit. Aceasta este lista de proiecte:\n";
  for (let i = 0; i < response.data.data.boards.length; i++) {
    message += `${i + 1} ${response.data.data.boards[i].name}\n`;
  }
  message += `Va rugam sa selectati raspunzand doar cu cifra proiectului`;
  return callback(null, {
    text: message,
  });
};

const axios = require("axios");

exports.handler = async function (context, event, callback) {
  if (event.selectedIndex == null) {
    throw new Error("Invalid index");
  }
  const selectedIndex = +event.selectedIndex;
  if (Number.isNaN(selectedIndex)) {
    throw new Error("Invalid index");
  }
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
  if (selectedIndex - 1 >= response.data.data.boards.length) {
    throw new Error("Invalid index");
  }
  return callback(null, {
    valid: true,
  });
};

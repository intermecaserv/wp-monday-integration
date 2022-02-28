const axios = require("axios");

exports.handler = async function (context, event, callback) {
  const response = await axios.post(
    "https://api.monday.com/v2",
    {
      query: "query { teams { name picture_url users { created_at phone } } }",
    },
    {
      headers: {
        Authorization: context.monday_token,
        "Content-Type": "application/json",
      },
    }
  );
  return callback(null, {
    items: response.data.data.teams.map((x) => x.name),
  });
};

const axios = require("axios");

exports.handler = async function (context, event, callback) {
  if (!event.projectId) {
    throw new Error("No Project ID selected");
  }

  const itemId = +event.projectId;

  if (Number.isNaN(itemId)) {
    throw new Error("Invalid Project ID");
  }

  if (event.phoneNo == null || event.phoneNo.length === 0) {
    throw new Error("No phone number");
  }

  if (event.order == null || event.order.length === 0) {
    throw new Error("Invalid order text");
  }

  const usersResponse = await axios.post(
    `https://api.monday.com/v2`,
    {
      query: `
    query {
    users(limit: 100) {
        id
        phone
        mobile_phone
        teams {
          id
        }
    }
}
    `,
    },
    {
      headers: {
        Authorization: context.monday_token,
        "Content-Type": "application/json",
      },
    }
  );
  const foundUser = usersResponse.data.data.users.find(
    (x) => x.mobile_phone === event.phoneNo || x.phone === event.phoneNo
  );
  if (foundUser == null) {
    throw new Error("User not found");
  }

  const colValues = {
    person: { personsAndTeams: [{ id: foundUser.id, kind: "person" }] },
  };
  const q = `
mutation {
    create_subitem (parent_item_id: ${itemId}, item_name: "${
    event.order
  }", column_values: ${JSON.stringify(JSON.stringify(colValues))}) {
        id
    }
}
    `;

  const createResponse = await axios.post(
    `https://api.monday.com/v2`,
    {
      query: q,
    },
    {
      headers: {
        Authorization: context.monday_token,
        "Content-Type": "application/json",
      },
    }
  );

  return callback(null, {
    ok: true,
    itemId: createResponse.data.data.create_subitem.id,
  });
};

const axios = require("axios");

exports.handler = async function (context, event, callback) {
  if (event.secret == null || event.secret !== context.secret) {
    throw new Exception("Unauthorized");
  }

  if (event.challenge) {
    return callback(null, { challenge: event.challenge });
  }

  const subitemResponse = await axios.post(
    `https://api.monday.com/v2`,
    {
      query: `
query {
    items (ids: [${+event.event.pulseId}]) {
        name
        column_values {
          id
          value
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

  const subitem = subitemResponse.data.data.items[0];
  const personColumnObj = JSON.parse(
    subitem.column_values.find((x) => x.id === "person").value
  );

  let userIds = personColumnObj.personsAndTeams
    .filter((x) => x.kind === "person")
    .map((x) => x.id);

  const teamIds = personColumnObj.personsAndTeams
    .filter((x) => x.kind === "team")
    .map((x) => x.id);
  if (teamIds.length > 0) {
    const teamsResponse = await axios.post(
      `https://api.monday.com/v2`,
      {
        query: `
query {
    teams(ids: [${teamIds.join()}]) {
        users {
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

    for (const team of teamsResponse.data.data.teams) {
      const teamUserIds = team.users.map((x) => x.id);
      userIds = [...userIds, ...teamUserIds];
    }
  }

  const usersResponse = await axios.post(
    `https://api.monday.com/v2`,
    {
      query: `
query {
    users (ids: [${userIds.join()}]) {
        phone
        mobile_phone
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

  const listOfPhoneNos = [
    ...new Set(
      usersResponse.data.data.users
        .map((x) => x.mobile_phone || x.phone)
        .filter((x) => x != null && x.length > 0)
    ),
  ];

  // TODO
  let message = `Comanda ${subitem.name} a fost marcata ca Finalizata.`;

  return callback(null, { ok: listOfPhoneNos });
};

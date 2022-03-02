const axios = require("axios");
const twilio = require("twilio");

exports.handler = async function (context, event, callback) {
  if (event.secret == null || event.secret !== context.secret) {
    throw new Error("Unauthorized");
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
  const twilioClient = twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
  for (let nr of listOfPhoneNos) {
    try {
      await twilioClient.messages.create({
        // from: 'whatsapp:+552120420682',
        body: message,
        to: "whatsapp:" + nr,
      });
    } catch (e) {
      // ignored
      console.error(e);
    }
  }
  return callback(null, { ok: listOfPhoneNos });
};

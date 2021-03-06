const axios = require("axios");

exports.handler = async function (context, event, callback) {
  if (event.phoneNo == null || event.phoneNo.length === 0) {
    throw new Error("No phone number");
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

  const projectsResponse = await axios.post(
    "https://api.monday.com/v2",
    {
      query: `
    query {
  boards (ids: ${context.board_id}) {
    id
    name
    items {
      id
      name
      column_values {
          id
          value
      }
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

  const filterMyProjects = (x) => {
    const foundColumn = x.column_values.find((x) => x.id === "person");
    if (
      foundColumn == null ||
      foundColumn.value == null ||
      foundColumn.value.length === 0
    ) {
      return false;
    }
    try {
      const valueObj = JSON.parse(foundColumn.value);
      if (
        valueObj.personsAndTeams == null ||
        valueObj.personsAndTeams.length === 0
      ) {
        return false;
      }
      return (
        valueObj.personsAndTeams.findIndex(
          (z) =>
            (z.kind === "person" && z.id === foundUser.id) ||
            (z.kind === "team" &&
              foundUser.teams.findIndex((t) => t.id === z.id) > -1)
        ) > -1
      );
    } catch (err) {
      return false;
    }
  };

  const filterOthersProjects = (x) => {
    const foundColumn = x.column_values.find((x) => x.id === "person");
    if (
      foundColumn == null ||
      foundColumn.value == null ||
      foundColumn.value.length === 0
    ) {
      return true;
    }
    try {
      const valueObj = JSON.parse(foundColumn.value);
      if (
        valueObj.personsAndTeams == null ||
        valueObj.personsAndTeams.length === 0
      ) {
        return true;
      }
      return (
        valueObj.personsAndTeams.findIndex(
          (z) =>
            (z.kind === "person" && z.id === foundUser.id) ||
            (z.kind === "team" &&
              foundUser.teams.findIndex((t) => t.id === z.id) > -1)
        ) === -1
      );
    } catch (err) {
      return true;
    }
  };

  const myItems = projectsResponse.data.data.boards[0].items.filter(
    event.othersProjects ? filterOthersProjects : filterMyProjects
  );

  let message = event.othersProjects
    ? ``
    : `Bun venit. Aceasta este lista proiectelor dvs:\n`;
  var i = 0;
  for (i = 0; i < myItems.length; i++) {
    message += `"${i + 1}" = ${myItems[i].name}\n`;
  }
  message += `"altele" = Proiectele ${
    event.othersProjects ? "mele" : "altora"
  }\n`;
  message += `Va rugam sa selectati raspunzand doar cu cifra proiectului sau "altele"`;
  return callback(null, {
    text: message,
  });
};

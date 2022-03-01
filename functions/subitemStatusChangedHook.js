// This is your new function. To start, set the name and path on the left.

exports.handler = function (context, event, callback) {
  if (event.challenge) {
    return callback(null, { challenge: event.challenge });
  }
  console.log(event.event);
  return callback(null, { ha: 1 });
};

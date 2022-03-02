const keywords = ["comanda", "comenzi"];

exports.handler = function (context, event, callback) {
  if (event.text == null || event.text.length === 0) {
    return callback(null, {valid: false});
  }
  const textLower = event.text.toLowerCase();
  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      return callback(null, {valid: true});
    }
  }
  return callback(null, {valid: false});
};

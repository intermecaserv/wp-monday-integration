const keywords = ["comanda", "comenzi"];

exports.handler = function (context, event, callback) {
  if (event.text == null || event.text.length === 0) {
    throw new Error("Invalid");
  }
  const textLower = event.text.toLowerCase();
  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      return callback(null, {valid: true});
    }
  }
    throw new Error('Invalid');
};

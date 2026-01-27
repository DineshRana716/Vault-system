const crypto = require("crypto");
const fs = require("fs");

const getFileHash = (filePath) => {
  const file = fs.readFileSync(filePath);

  const hash = crypto.createHash("sha256").update(file).digest("hex");

  return hash;
};
module.exports = getFileHash;

const jwt = require("jsonwebtoken");
const jwt_secret = process.env.jwt_secret;

//genrate token
const generatetoken = (payload) => {
  return jwt.sign(payload, jwt_secret, { expires: "1h" });
};
//verify token
const verifytoken = (token) => {
  return jwt.verify(token, jwt_secret);
};
module.exports = { generatetoken, verifytoken };

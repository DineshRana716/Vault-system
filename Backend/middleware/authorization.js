const jwt = require("jsonwebtoken");
const jwt_secret = process.env.jwt_secret;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  //check header exists
  if (!authHeader) {
    return res.status(401).json({ message: "authorization header missing" });
  }
  //format:bearer token
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "token missing" });
  }
  try {
    const decoded = jwt.verify(token, jwt_secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "invalid or expired token" });
  }
};
module.exports = authMiddleware;

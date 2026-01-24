const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "vaultdb",
  password: "9304650646",
  port: 5432,
});

module.exports = pool;

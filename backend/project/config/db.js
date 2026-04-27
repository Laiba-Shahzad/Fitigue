const sql = require('mssql');
require('dotenv').config();

// const config = {
//   server: process.env.DB_SERVER,
//   database: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   options: {
//     encrypt: false,
//     trustServerCertificate: true,
//   },
// };
const config = {
  server: "127.0.0.1",
  port: 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch((err) => console.error('DB Connection Failed:', err));

module.exports = { sql, poolPromise };
const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345678',
    server: 'localhost',
    database: 'lab3',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => console.error('Connection failed:', err));

module.exports = { sql, poolPromise };
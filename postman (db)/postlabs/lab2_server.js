const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db2');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/insert_salesman', async (req, res) => {
    try {
        const { salesman_id, name, city, commission } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('salesman_id', sql.Int, salesman_id)
            .input('name', sql.VarChar, name)
            .input('city', sql.VarChar, city)
            .input('commission', sql.Decimal(4,2), commission)
            .query(`INSERT INTO salesman VALUES 
                   (@salesman_id, @name, @city, @commission)`);

        res.json({ message: 'Salesman inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/insert_orders', async (req, res) => {
    try {
        const { ord_no, purch_amt, ord_date, customer_id, salesman_id } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('ord_no', sql.Int, ord_no)
            .input('purch_amt', sql.Decimal(10,2), purch_amt)
            .input('ord_date', sql.Date, ord_date)
            .input('customer_id', sql.Int, customer_id)
            .input('salesman_id', sql.Int, salesman_id)
            .query(`INSERT INTO orders VALUES 
                   (@ord_no, @purch_amt, @ord_date, @customer_id, @salesman_id)`);

        res.json({ message: 'Order inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/insert_customers', async (req, res) => {
    try {
        const { customer_id, cust_name, city, grade, salesman_id } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('cust_name', sql.VarChar, cust_name)
            .input('city', sql.VarChar, city)
            .input('grade', sql.Int, grade)
            .input('salesman_id', sql.Int, salesman_id)
            .query(`INSERT INTO customers VALUES 
                   (@customer_id, @cust_name, @city, @grade, @salesman_id)`);

        res.json({ message: 'Customer inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
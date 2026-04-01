const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db4');

const app = express();
app.use(cors());
app.use(express.json());

// POST /race
app.post('/race', async (req, res) => {
    try {
        const { race_name, location, race_date, track_length, max_participants } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('race_name', sql.VarChar, race_name)
            .input('location', sql.VarChar, location)
            .input('race_date', sql.DateTime, race_date)
            .input('track_length', sql.Decimal(5, 2), track_length)
            .input('max_participants', sql.Int, max_participants)
            .query(`INSERT INTO Race 
                   (race_name, location, race_date, track_length, max_participants)
                   VALUES 
                   (@race_name, @location, @race_date, @track_length, @max_participants)`);

        res.json({ message: 'Race inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /race-result
app.post('/race-result', async (req, res) => {
    try {
        const { race_id, driver_id, finishing_position, completion_time } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('race_id', sql.Int, race_id)
            .input('driver_id', sql.Int, driver_id)
            .input('finishing_position', sql.Int, finishing_position)
            .input('completion_time', sql.Decimal(6, 2), completion_time)
            .query(`INSERT INTO Race_Result 
                   (race_id, driver_id, finishing_position, completion_time)
                   VALUES 
                   (@race_id, @driver_id, @finishing_position, @completion_time)`);

        res.json({ message: 'Race Result inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /drivers
// GET /drivers?country=USA
app.get('/drivers', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { country } = req.query;

        let query = `SELECT * FROM Driver WHERE 1=1`;
        const request = pool.request();

        if (country) {
            query += ` AND country = @country`;
            request.input('country', sql.VarChar, country);
        }

        query += ` ORDER BY last_name ASC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /driver-rewards
// GET /driver-rewards?name=Fastest Lap
// GET /driver-rewards?amount>5000
app.get('/driver-rewards', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { name, amount } = req.query;

        let query = `SELECT driver_id FROM Driver_Reward WHERE 1=1`;
        const request = pool.request();

        if (name) {
            query += ` AND reward_name = @name`;
            request.input('name', sql.VarChar, name);
        }
        if (amount) {
            query += ` AND reward_amount >= @amount`;
            request.input('amount', sql.Int, parseInt(amount));
        }
       
        query += ` ORDER BY reward_amount DESC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(6000, () => console.log('Server running on http://localhost:6000'));
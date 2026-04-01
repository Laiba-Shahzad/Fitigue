const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db5');

const app = express();
app.use(cors());
app.use(express.json());

// POST /creature
app.post('/creature', async (req, res) => {
    try {
        const { Name, Type, SpecificPowerID, Status } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('Name', sql.VarChar, Name)
            .input('Type', sql.VarChar, Type)
            .input('SpecificPowerID', sql.Int, SpecificPowerID)
            .input('Status', sql.VarChar, Status)
            .query(`INSERT INTO Creature
                   (Name, Type, SpecificPowerID, Status)
                   VALUES 
                   (@Name, @Type, @SpecificPowerID, @Status)`);

        res.json({ message: 'Creature inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /Fight
app.post('/fight', async (req, res) => {
    try {
        const { Creature1ID, Creature2ID, WinnerID, Date } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('Creature1ID', sql.Int, Creature1ID)
            .input('Creature2ID', sql.Int, Creature2ID)
            .input('WinnerID', sql.Int, WinnerID)
            .input('Date', sql.DateTime, Date)
            .query(`INSERT INTO Fight 
                   (Creature1ID, Creature2ID, WinnerID, Date)
                   VALUES 
                   (@Creature1ID, @Creature2ID, @WinnerID, @Date)`);

        res.json({ message: 'Fight inserted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /death-log
// GET /death-log?cause=Defeated by Bubbles
app.get('/death-log', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { cause } = req.query;

        let query = `SELECT * FROM DeathLog WHERE 1=1`;
        const request = pool.request();

        if (cause) {
            query += ` AND CAST(Cause AS VARCHAR(MAX))= @cause`;
            request.input('cause', sql.VarChar, cause);
        }

        query += ` ORDER BY DeathDate ASC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /family-relation
// GET /family-relation?type=Sibling
app.get('/family-relation', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { type } = req.query;

        let query = `SELECT * FROM FamilyRelation WHERE 1=1`;
        const request = pool.request();

        if (type) {
            query += ` AND RelationType = @type`;
            request.input('type', sql.VarChar, type);
        }
       
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(7000, () => console.log('Server running on http://localhost:7000'));
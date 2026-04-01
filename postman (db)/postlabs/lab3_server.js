const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db3');

const app = express();
app.use(cors());
app.use(express.json());

// GET /movies 
// GET /movies?genre=Action
// GET /movies?after=2015
// GET /movies?genre=Action&after=2015
app.get('/movies', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {genre, after} = req.query;

        let query = `SELECT * FROM Movies WHERE 1=1`;
        const request = pool.request();

        if (genre) {
            query += ` AND Genre = @genre`;
            request.input('genre', sql.VarChar, genre)
        }

        if (after) {
            query += ` AND ReleaseYear > @after`;
            request.input('after', sql.Int, parseInt(after));
        }

        query += ` ORDER BY ReleaseYear ASC`;
        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /cricket
// GET /cricket?country=India
// GET /cricket?after=2015
// GET /cricket?role=Batsman
app.get('/cricket', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {after, country, role} = req.query;

       
        let query = `SELECT * FROM Cricket WHERE 1=1`;
        const request = await pool.request();
 
        if(after){
            query += ` AND MatchDate > @after`;
            request.input('after', sql.Int, parseInt(after));
        }
        if(country){
            query += ` AND Country = @country`;
            request.input('country', sql.VarChar, country);
        }
        if(role){
            query += `AND Role = @role`;
            request.input('role', sql.VarChar, role);
        }

        query += ` ORDER BY MatchDate ASC`;
        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /space-missions
// GET /space-missions?after=2000
// GET /space-missions?agency=NASA
app.get('/space-missions', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {after, agency} = req.query;

        let query = `SELECT * FROM SpaceMissions WHERE 1=1`;
        const request = pool.request();

        if (after) {
            query += ` AND LaunchYear > @after`;
            request.input('after', sql.Int, parseInt(after));
        }

        if (agency) {
            query += ` AND Agency = @agency`;
            request.input('agency', sql.VarChar, agency);
        }

        query += ` ORDER BY LaunchYear ASC`
        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /football
// GET /football?position=Forward
// GET /football?country=Brazil
app.get('/football', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { position, country } = req.query;

        let query = `SELECT * FROM Football WHERE 1=1`;
        const request = pool.request();

        if (position) {
            query += ` AND Position = @position`;
            request.input('position', sql.VarChar, position);
        }
        if (country) {
            query += ` AND Country = @country`;
            request.input('country', sql.VarChar, country);
        }

        query += ` ORDER BY GoalsScored DESC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /recipes
// GET /recipes?cuisine=Italian
// GET /recipes?maxtime=30
app.get('/recipes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { cuisine, maxtime } = req.query;

        let query = `SELECT * FROM Recipes WHERE 1=1`;
        const request = pool.request();

        if (cuisine) {
            query += ` AND Cuisine = @cuisine`;
            request.input('cuisine', sql.VarChar, cuisine);
        }
        if (maxtime) {
            query += ` AND CookingTime <= @maxtime`;
            request.input('maxtime', sql.Int, parseInt(maxtime));
        }

        query += ` ORDER BY CookingTime ASC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /workouts
// GET /workouts?category=Cardio
// GET /workouts?mincalories=200
app.get('/workouts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { category, mincalories } = req.query;

        let query = `SELECT * FROM Workouts WHERE 1=1`;
        const request = pool.request();

        if (category) {
            query += ` AND Category = @category`;
            request.input('category', sql.VarChar, category);
        }
        if (mincalories) {
            query += ` AND CaloriesBurned >= @mincalories`;
            request.input('mincalories', sql.Int, parseInt(mincalories));
        }

        query += ` ORDER BY CaloriesBurned DESC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /poetry
// GET /poetry?theme=Love
// GET /poetry?era=Romantic
app.get('/poetry', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { theme, era } = req.query;

        let query = `SELECT * FROM Poetry WHERE 1=1`;
        const request = pool.request();

        if (theme) {
            query += ` AND Theme = @theme`;
            request.input('theme', sql.VarChar, theme);
        }
        if (era) {
            query += ` AND Era = @era`;
            request.input('era', sql.VarChar, era);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /physics
// GET /physics?field=Quantum Mechanics
// GET /physics?after=2000
app.get('/physics', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { field, after } = req.query;

        let query = `SELECT * FROM PhysicsExperiments WHERE 1=1`;
        const request = pool.request();

        if (field) {
            query += ` AND Field = @field`;
            request.input('field', sql.VarChar, field);
        }
        if (after) {
            query += ` AND YearConducted > @after`;
            request.input('after', sql.Int, parseInt(after));
        }

        query += ` ORDER BY YearConducted ASC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /mathematics
// GET /mathematics?category=Calculus
// GET /mathematics?difficulty=Hard
app.get('/mathematics', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { category, difficulty } = req.query;

        let query = `SELECT * FROM Mathematics WHERE 1=1`;
        const request = pool.request();

        if (category) {
            query += ` AND Category = @category`;
            request.input('category', sql.VarChar, category);
        }
        if (difficulty) {
            query += ` AND DifficultyLevel = @difficulty`;
            request.input('difficulty', sql.VarChar, difficulty);
        }

        query += ` ORDER BY Points ASC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
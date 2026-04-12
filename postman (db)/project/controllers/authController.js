const { sql, poolPromise } = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`SELECT * FROM Users WHERE email = @email`);

    const user = result.recordset[0];
    console.log('User found: user');
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('DB password: ', user.password_hash);
    console.log('Entered password: ', password);

    if (password !== user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
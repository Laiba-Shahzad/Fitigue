const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wardrobe',    require('./routes/wardrobeRoutes'));    
app.use('/api/marketplace', require('./routes/marketplaceRoutes')); 
////add routes here


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
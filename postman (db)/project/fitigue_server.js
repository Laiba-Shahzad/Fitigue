const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wardrobe',    require('./routes/wardrobeRoutes'));    
app.use('/api/marketplace', require('./routes/marketplaceRoutes')); 
app.use('/api/clothing-requests', require('./routes/clothingRequestsRoutes')); 
app.use('/api/history', require('./routes/tradeHistoryRoutes')); 
app.use('/api/notifications', require('./routes/notificationSystemRoutes'));
app.use('/api/ratings', require('./routes/ratingSystemRoutes'));

////add routes here


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

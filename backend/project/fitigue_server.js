const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wardrobe',    require('./routes/wardrobeRoutes'));    
app.use('/api/marketplace', require('./routes/marketplaceRoutes')); 
app.use('/api/clothing-requests', require('./routes/clothingRequestsRoutes')); 
app.use('/api/history', require('./routes/tradeHistoryRoutes')); 
app.use('/api/notifications', require('./routes/notificationSystemRoutes'));
app.use('/api/ratings', require('./routes/ratingSystemRoutes'));
app.use('/api/purchases',require('./routes/purchaseRoutes'));
app.use('/api/swaps',require('./routes/swapRoutes'));
app.use('/api/chats',require('./routes/chatRoutes'));
////add routes here


const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0', () => console.log(`Server running on port ${PORT}`));

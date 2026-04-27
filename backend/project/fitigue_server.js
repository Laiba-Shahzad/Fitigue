const cors = require('cors');
const express = require('express');
const app = express();
require('dotenv').config();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import the routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses'); // 1. Add this line

// Tell Express to use them
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes); // 2. Add this line

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Compass'))
  .catch((err) => console.log('Database connection error: ', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
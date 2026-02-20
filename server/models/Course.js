const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true // Ensures "csc112" becomes "CSC112" in the DB
    },
    name: { 
        type: String, 
        required: true,
        uppercase: true // Ensures "data structures" becomes "DATA STRUCTURES"
    },
    creditHours: { 
        type: Number, 
        required: true,
        min: 1, // Minimum limit
        max: 6  // Maximum limit
    }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
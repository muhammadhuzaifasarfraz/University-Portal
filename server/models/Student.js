const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    firstname: { type: String, required: true , uppercase: true, trim: true, },
    lastname: { type: String, required: false , uppercase: true, trim: true, },
    contact: { type: String, required: false },
    email: { type: String, required: true, unique: true, lowercase: true },
    // Notice we do NOT use lowercase: true on the password!
    password: { type: String, required: true },
    // We will store course names or IDs in an array
    courses: [{ type: String }] 
}, { timestamps: true });

// Hash the password before saving (Modern Async Version)
studentSchema.pre('save', async function() {
    // If the password hasn't been changed, skip this step
    if (!this.isModified('password')) return;

    // No need for 'next' parameter when using async/await in modern Mongoose
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Student', studentSchema);
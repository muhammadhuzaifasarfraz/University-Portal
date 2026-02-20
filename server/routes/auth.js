const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const router = express.Router();

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    try {
        const { firstname, lastname, contact, email, password } = req.body;
        let student = await Student.findOne({ email });
        if (student) return res.status(400).json({ message: 'Student already exists' });

        student = new Student({ firstname, lastname, contact, email, password });
        await student.save();

        res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
        console.error("Signup Error:", error.message); 
        res.status(500).json({ message: error.message }); 
    }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });
        if (!student) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: student._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        const fullName = [student.firstname, student.lastname].filter(Boolean).join(' ');
        res.status(200).json({
            token,
            student: { 
                id: student._id, 
                name: fullName, 
                email: student.email, 
                contact: student.contact, 
                courses: student.courses 
            }
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET FRESH STUDENT DATA (To fix the lag)
router.get('/student/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        const fullName = [student.firstname, student.lastname].filter(Boolean).join(' ');
        res.json({
            id: student._id,
            name: fullName,
            email: student.email,
            contact: student.contact,
            courses: student.courses
        });
    } catch (error) {
        res.status(500).json({ message: "Error refreshing data" });
    }
});

module.exports = router;
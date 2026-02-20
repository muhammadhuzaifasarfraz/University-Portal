const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');

// 1. Get all available courses for registration
router.get('/available', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Register a course for a student
router.post('/register', async (req, res) => {
    const { studentId, courseCode } = req.body;
    try {
        const student = await Student.findById(studentId);
        if (student.courses.includes(courseCode)) {
            return res.status(400).json({ message: 'Course already registered' });
        }
        student.courses.push(courseCode);
        await student.save();
        res.json({ message: 'Course added', courses: student.courses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Update a course
router.put('/update/:id', async (req, res) => {
    try {
        const { code, name, creditHours } = req.body;
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { code, name, creditHours: Number(creditHours) },
            { new: true }
        );
        res.json(updatedCourse);
    } catch (err) {
        res.status(400).json({ message: "Update failed" });
    }
});

// 4. Check enrollment count before deletion
router.get('/enrollment-count/:code', async (req, res) => {
    try {
        // Counts how many students have this course code in their array
        const count = await Student.countDocuments({ courses: req.params.code });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: "Error checking enrollment" });
    }
});

// 5. Delete a course (With Cascade Student Cleanup)
router.delete('/delete/:id', async (req, res) => {
    try {
        // First, find the course to identify the code being removed
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const courseCode = course.code;

        // Remove the course from the Course collection
        await Course.findByIdAndDelete(req.params.id);

        // Remove the course code from ALL students' courses array
        await Student.updateMany(
            { courses: courseCode },
            { $pull: { courses: courseCode } }
        );

        res.json({ message: "Course deleted and removed from all student records" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed", error: err.message });
    }
});

// 6. Drop/Remove a course for a student
router.post('/drop', async (req, res) => {
    const { studentId, courseCode } = req.body;
    try {
        const student = await Student.findById(studentId);
        student.courses = student.courses.filter(code => code !== courseCode);
        await student.save();
        res.json({ message: 'Course removed', courses: student.courses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Add a new course
router.post('/add', async (req, res) => {
    const { code, name, creditHours } = req.body;
    try {
        const newCourse = new Course({ code, name, creditHours });
        await newCourse.save();
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(400).json({ message: "Course already exists or invalid data" });
    }
});

module.exports = router;
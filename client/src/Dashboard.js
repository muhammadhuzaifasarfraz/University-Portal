import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './Dashboard.css';
import './CourseCard.css';
import './AdminModal.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [student, setStudent] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Admin States
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [newCourse, setNewCourse] = useState({ code: '', name: '', creditHours: '' });

  // CRUD States
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const savedStudent = JSON.parse(localStorage.getItem('student'));
    
    if (savedStudent && savedStudent.id) {
      // REFRESH DATA FROM BACKEND ON LOAD
      axios.get(`http://localhost:5000/api/auth/student/${savedStudent.id}`)
        .then(res => {
          setStudent(res.data);
          localStorage.setItem('student', JSON.stringify(res.data));
        })
        .catch(err => {
          console.error("Refresh failed, using local storage", err);
          setStudent(savedStudent);
        });
    }
  }, []);

  // 1. AUTO-LOGOUT & TAB CLEANUP
  useEffect(() => {
    if (activeTab !== 'newCourses') {
      setIsAdmin(false); 
      setShowAdminLogin(false); 
      setAdminCreds({ username: '', password: '' }); 
      resetCourseForm();
    }
    
    if (activeTab === 'newCourses') {
      fetchAvailableCourses();
    }
  }, [activeTab]);

  const fetchAvailableCourses = () => {
    axios.get('http://localhost:5000/api/courses/available')
      .then(res => setAvailableCourses(res.data))
      .catch(err => console.error(err));
  };

  const resetCourseForm = () => {
    setNewCourse({ code: '', name: '', creditHours: '' });
    setIsEditing(false);
    setEditId(null);
  };

  // --- VALIDATION & HANDLERS ---

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      setAdminCreds({ ...adminCreds, [name]: value });
    }
  };

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'code') {
      if (value.length <= 3) {
        if (/^[a-zA-Z]*$/.test(value)) {
          setNewCourse({ ...newCourse, [name]: value.toUpperCase() });
        }
      } else {
        const prefix = value.substring(0, 3);
        const suffix = value.substring(3);
        if (/^[0-9]*$/.test(suffix)) {
          setNewCourse({ ...newCourse, [name]: prefix.toUpperCase() + suffix });
        }
      }
    } else if (name === 'name') {
      if (/^[a-zA-Z\s]*$/.test(value)) {
        setNewCourse({ ...newCourse, [name]: value.toUpperCase() });
      }
    }
  };

  const handleCreditChange = (e) => {
    const val = e.target.value;
    if (val === "" || (Number(val) >= 1 && Number(val) <= 6)) {
      setNewCourse({ ...newCourse, creditHours: val });
    }
  };

  const toggleAdminModal = (show) => {
    if (!show) setAdminCreds({ username: '', password: '' });
    setShowAdminLogin(show);
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
    setAdminCreds({ username: '', password: '' });
    resetCourseForm();
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminCreds.username === 'admin' && adminCreds.password === 'admin') {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert("Invalid Admin Credentials");
      setAdminCreds({ username: '', password: '' }); 
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // 1. Find the original course from the availableCourses array
        const originalCourse = availableCourses.find(c => c._id === editId);

        // 2. Compare every field to check for changes
        const isUnchanged = 
          originalCourse.code === newCourse.code &&
          originalCourse.name === newCourse.name &&
          Number(originalCourse.creditHours) === Number(newCourse.creditHours);

        // 3. If nothing changed, show the popup and stop
        if (isUnchanged) {
          alert("Nothing changed! Please modify a field or click Cancel Edit.");
          return; 
        }

        // 4. Proceed with update if changes were detected
        await axios.put(`http://localhost:5000/api/courses/update/${editId}`, newCourse);
        alert("Course Updated Successfully!");
      } else {
        await axios.post('http://localhost:5000/api/courses/add', newCourse);
        alert("Course Added Successfully!");
      }
      resetCourseForm();
      fetchAvailableCourses(); 
    } catch (err) {
      alert("Operation failed: " + (err.response?.data?.message || "Check server"));
    }
  };

  // UPDATED: Enrollment-aware Delete Logic
  const handleDeleteCourse = async (course) => {
    try {
      // 1. Check enrollment count before proceeding
      const countRes = await axios.get(`http://localhost:5000/api/courses/enrollment-count/${course.code}`);
      const count = countRes.data.count;

      let confirmMessage = "Are you sure you want to permanently delete this course?";
      
      // 2. Dynamic popup message if students are registered
      if (count > 0) {
        confirmMessage = `${count} ${count === 1 ? 'student has' : 'students have'} registered for this course. Are you still sure you want to remove it?`;
      }

      // 3. Final confirmation
      if (window.confirm(confirmMessage)) {
        await axios.delete(`http://localhost:5000/api/courses/delete/${course._id}`);
        fetchAvailableCourses();
        alert("Course deleted successfully.");
      }
    } catch (err) {
      console.error("Delete process error:", err);
      alert("Could not complete deletion check.");
    }
  };

  const handleEditClick = (course) => {
    setIsEditing(true);
    setEditId(course._id);
    setNewCourse({ 
      code: course.code, 
      name: course.name, 
      creditHours: course.creditHours 
    });
    window.scrollTo(0, 0);
  };

  const handleCourseAction = async (action, courseCode) => {
    try {
        const response = await axios.post(`http://localhost:5000/api/courses/${action}`, {
            studentId: student.id,
            courseCode: courseCode
        });
        const updatedStudent = { ...student, courses: response.data.courses };
        setStudent(updatedStudent);
        localStorage.setItem('student', JSON.stringify(updatedStudent));
        alert(`Successfully ${action === 'register' ? 'registered' : 'dropped'} ${courseCode}`);
    } catch (err) {
        alert(err.response?.data?.message || "Operation failed");
    }
  };

  if (!student) return <div className="loading-screen">Loading Portal...</div>;

  return (
    <div className="dashboard-wrapper">
      <Navbar setActiveTab={setActiveTab} />
      
      <div className="dashboard-content">
        {activeTab === 'profile' && (
          <div className="tab-card profile-view">
            <h2>Student Profile</h2>
            <hr />
            <div className="profile-info">
                <p><strong>Full Name:</strong> {student.name}</p>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Contact:</strong> {student.contact || 'Not Provided'}</p>
                <p><strong>Student ID:</strong> {student.id}</p>
            </div>
          </div>
        )}

        {activeTab === 'myCourses' && (
          <div className="tab-card">
            <h2>My Enrolled Courses</h2>
            <div className="course-grid">
              {student.courses && student.courses.length > 0 ? (
                student.courses.map((code) => (
                  <div key={code} className="modern-course-card enrolled">
                    <div className="course-header">
                      <span className="course-code-tag">{code}</span>
                    </div>
                    <div className="course-body"><h3>REGISTERED SUBJECT</h3></div>
                    <button className="action-btn drop-btn" onClick={() => handleCourseAction('drop', code)}>
                      Drop Course
                    </button>
                  </div>
                ))
              ) : <p className="empty-msg">You have not registered for any courses yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'newCourses' && (
          <div className="tab-card">
            <div className="tab-header-flex">
              <h2>Available for Registration</h2>
              {!isAdmin ? (
                <button className="admin-access-btn" onClick={() => toggleAdminModal(true)}>Admin Access</button>
              ) : (
                <div className="admin-panel">
                  <h3>{isEditing ? 'Update Course' : 'Add New Course'}</h3>
                  <form onSubmit={handleCourseSubmit} className="admin-form">
                    <input type="text" name="code" placeholder="Course Code (e.g. CSC112)" value={newCourse.code} onChange={handleCourseInputChange} required />
                    <input type="text" name="name" placeholder="Course Name" value={newCourse.name} onChange={handleCourseInputChange} required />
                    <input type="number" placeholder="Credit hours" value={newCourse.creditHours} onChange={handleCreditChange} required />
                    <div className="admin-form-btns">
                      <button type="submit" className="save-btn">{isEditing ? 'Update' : 'Save'}</button>
                      {isEditing && <button type="button" className="cancel-btn" onClick={resetCourseForm}>Cancel Edit</button>}
                      <button type="button" className="exit-btn" onClick={handleExitAdmin}>Exit Admin</button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="course-grid">
              {availableCourses.length > 0 ? (
                availableCourses.map((course) => (
                  <div key={course._id} className="modern-course-card">
                    <div className="course-header">
                      <span className="course-code-tag">{course.code}</span>
                      <span className="credit-badge">{course.creditHours} Credits</span>
                    </div>
                    <div className="course-body"><h3>{course.name}</h3></div>
                    
                    {!isAdmin ? (
                      <button 
                        className={`action-btn ${student.courses?.includes(course.code) ? 'disabled-btn' : 'reg-btn'}`}
                        onClick={() => handleCourseAction('register', course.code)}
                        disabled={student.courses?.includes(course.code)}
                      >
                        {student.courses?.includes(course.code) ? 'Registered' : 'Register Now'}
                      </button>
                    ) : (
                      <div className="admin-actions">
                        <button className="edit-btn-sm" onClick={() => handleEditClick(course)}>Edit</button>
                        {/* Pass entire course object for the enrollment check */}
                        <button className="delete-btn-sm" onClick={() => handleDeleteCourse(course)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))
              ) : <p className="empty-msg">No courses available in the database.</p>}
            </div>
          </div>
        )}
      </div>

      {showAdminLogin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Admin Login</h2>
            <form onSubmit={handleAdminLogin}>
              <input type="text" name="username" placeholder="Username" required value={adminCreds.username} onChange={handleAdminInputChange} />
              <input type="password" name="password" placeholder="Password" required value={adminCreds.password} onChange={handleAdminInputChange} />
              <div className="modal-buttons">
                <button type="submit" className="login-btn">Login</button>
                <button type="button" className="cancel-btn" onClick={() => toggleAdminModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
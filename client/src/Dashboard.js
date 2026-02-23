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
  
  const [newCourse, setNewCourse] = useState({ 
    code: '', 
    name: '', 
    creditHours: '', 
    semester: '', 
    isCompulsory: false 
  });

  // CRUD States
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const savedStudent = JSON.parse(localStorage.getItem('student'));
    
    if (savedStudent && savedStudent.id) {
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

  useEffect(() => {
    if (activeTab !== 'newCourses') {
      setIsAdmin(false); 
      setShowAdminLogin(false); 
      setAdminCreds({ username: '', password: '' }); 
      resetCourseForm();
    }
    
    // Always fetch available courses to ensure mapping works for "My Courses"
    fetchAvailableCourses();
  }, [activeTab]);

  const fetchAvailableCourses = () => {
    axios.get('http://localhost:5000/api/courses/available')
      .then(res => setAvailableCourses(res.data))
      .catch(err => console.error(err));
  };

  const resetCourseForm = () => {
    setNewCourse({ code: '', name: '', creditHours: '', semester: '', isCompulsory: false });
    setIsEditing(false);
    setEditId(null);
  };

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      setAdminCreds({ ...adminCreds, [name]: value });
    }
  };

  const handleCourseInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        setNewCourse({ ...newCourse, [name]: checked });
        return;
    }

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
    } else {
        setNewCourse({ ...newCourse, [name]: value });
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
        const originalCourse = availableCourses.find(c => c._id === editId);
        const isUnchanged = 
          originalCourse.code === newCourse.code &&
          originalCourse.name === newCourse.name &&
          Number(originalCourse.creditHours) === Number(newCourse.creditHours) &&
          Number(originalCourse.semester) === Number(newCourse.semester) &&
          originalCourse.isCompulsory === newCourse.isCompulsory;

        if (isUnchanged) {
          alert("Nothing changed! Please modify a field or click Cancel Edit.");
          return; 
        }

        await axios.put(`http://localhost:5000/api/courses/update/${editId}`, newCourse);
        alert("Course Updated Successfully!");
      } else {
        await axios.post('http://localhost:5000/api/courses/add', newCourse);
        alert("Course Added Successfully!");
      }
      resetCourseForm();
      fetchAvailableCourses(); 
    } catch (err) {
      alert("Operation failed: " + (err.response?.data?.message || "Check server connection"));
    }
  };

  const handleDeleteCourse = async (course) => {
    try {
      const countRes = await axios.get(`http://localhost:5000/api/courses/enrollment-count/${course.code}`);
      const count = countRes.data.count;

      let confirmMessage = "Are you sure you want to permanently delete this course?";
      if (count > 0) {
        confirmMessage = `${count} ${count === 1 ? 'student has' : 'students have'} registered for this course. Are you still sure you want to remove it?`;
      }

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
      creditHours: course.creditHours,
      semester: course.semester || '',
      isCompulsory: course.isCompulsory || false
    });
    window.scrollTo(0, 0);
  };

  // Academic Rules: 21 Cr limit and Drop restrictions
  const handleCourseAction = async (action, courseCode) => {
    try {
        const targetCourse = availableCourses.find(c => c.code === courseCode);
        
        if (action === 'register') {
            // Calculate current semester load
            const semesterCredits = availableCourses
                .filter(c => student.courses.includes(c.code) && Number(c.semester) === Number(targetCourse.semester))
                .reduce((sum, c) => sum + Number(c.creditHours), 0);

            if (semesterCredits + Number(targetCourse.creditHours) > 21) {
                alert(`You cannot register more than 21 credit hours in Semester ${targetCourse.semester}. Current Load: ${semesterCredits}`);
                return;
            }
        }

        const response = await axios.post(`http://localhost:5000/api/courses/${action}`, {
            studentId: student.id,
            courseCode: courseCode
        });
        const updatedStudent = { ...student, courses: response.data.courses };
        setStudent(updatedStudent);
        localStorage.setItem('student', JSON.stringify(updatedStudent));
        alert(`Successfully ${action}ed ${courseCode}`);
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

        {/* My Courses Tab: Organized Semester Tables */}
        {activeTab === 'myCourses' && (
          <div className="tab-card">
            <h2>My Academic Record</h2>
            <div className="semester-container">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                // Find full details for enrolled courses in this semester
                const enrolledInSem = availableCourses.filter(
                  c => student.courses?.includes(c.code) && Number(c.semester) === semNum
                );

                if (enrolledInSem.length === 0) return null;

                const totalSemCredits = enrolledInSem.reduce((sum, c) => sum + Number(c.creditHours), 0);

                return (
                  <div key={semNum} className="student-sem-box">
                    <div className="student-sem-header">
                      <h3>Semester {semNum}</h3>
                      <span className="sem-load">Semester Load: {totalSemCredits}/21 Cr.</span>
                    </div>
                    
                    <div className="semester-table-wrapper">
                      <table className="semester-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Course Name</th>
                            <th>Cr. Hrs</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledInSem.map((course) => (
                            <tr key={course._id}>
                              <td><span className="table-code">{course.code}</span></td>
                              <td>
                                {course.name}
                                {course.isCompulsory && <span className="compulsory-badge">Compulsory</span>}
                              </td>
                              <td>{course.creditHours}</td>
                              <td>
                                {course.isCompulsory ? (
                                  <span className="locked-tag" title="Compulsory courses cannot be dropped">Locked</span>
                                ) : (
                                  <button className="table-delete-btn" onClick={() => handleCourseAction('drop', course.code)}>
                                    Drop
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              {student.courses?.length === 0 && <p className="empty-msg">You have not registered for any courses yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'newCourses' && (
          <div className="tab-card">
            <div className="tab-header-flex">
              <h2>Academic Curriculum</h2>
              {!isAdmin ? (
                <button className="admin-access-btn" onClick={() => toggleAdminModal(true)}>Admin Access</button>
              ) : (
                <div className="admin-panel">
                  <h3>{isEditing ? 'Update Course' : 'Add New Course'}</h3>
                  <form onSubmit={handleCourseSubmit} className="admin-form">
                    <input type="text" name="code" placeholder="Course Code" value={newCourse.code} onChange={handleCourseInputChange} required />
                    <input type="text" name="name" placeholder="Course Name" value={newCourse.name} onChange={handleCourseInputChange} required />
                    <input type="number" placeholder="Credits" value={newCourse.creditHours} onChange={handleCreditChange} required />
                    
                    <select name="semester" value={newCourse.semester} onChange={handleCourseInputChange} required className="semester-select">
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={num}>Semester {num}</option>
                      ))}
                    </select>

                    <div className="checkbox-group">
                        <input type="checkbox" id="isCompulsory" name="isCompulsory" checked={newCourse.isCompulsory} onChange={handleCourseInputChange} />
                        <label htmlFor="isCompulsory">Compulsory Course</label>
                    </div>

                    <div className="admin-form-btns">
                      <button type="submit" className="save-btn">{isEditing ? 'Update' : 'Save'}</button>
                      {isEditing && <button type="button" className="cancel-btn" onClick={resetCourseForm}>Cancel Edit</button>}
                      <button type="button" className="exit-btn" onClick={handleExitAdmin}>Exit Admin</button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="semester-container">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                const semesterCourses = availableCourses.filter(c => Number(c.semester) === semNum);
                
                return (
                  <details key={semNum} className="semester-dropdown">
                    <summary className="semester-summary">
                      Semester {semNum} 
                      <span className="course-count">{semesterCourses.length} Subjects</span>
                    </summary>
                    
                    <div className="semester-table-wrapper">
                      {semesterCourses.length > 0 ? (
                        <table className="semester-table">
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Course Name</th>
                              <th>Cr. Hrs</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semesterCourses.map((course) => (
                              <tr key={course._id} className={course.isCompulsory ? "compulsory-row" : ""}>
                                <td><span className="table-code">{course.code}</span></td>
                                <td>
                                    {course.name}
                                    {course.isCompulsory && <span className="compulsory-badge">Compulsory</span>}
                                </td>
                                <td>{course.creditHours}</td>
                                <td>
                                  {!isAdmin ? (
                                    <button 
                                      className={`table-reg-btn ${student.courses?.includes(course.code) ? 'enrolled' : ''}`}
                                      onClick={() => handleCourseAction('register', course.code)}
                                      disabled={student.courses?.includes(course.code)}
                                    >
                                      {student.courses?.includes(course.code) ? 'Registered' : 'Register'}
                                    </button>
                                  ) : (
                                    <div className="table-admin-actions">
                                      <button className="table-edit-btn" onClick={() => handleEditClick(course)}>Edit</button>
                                      <button className="table-delete-btn" onClick={() => handleDeleteCourse(course)}>Delete</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-courses-msg">No courses assigned to this semester.</p>
                      )}
                    </div>
                  </details>
                );
              })}
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
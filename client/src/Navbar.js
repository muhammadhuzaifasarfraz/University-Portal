import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ setActiveTab }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('student');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">UniPortal</div>
      <ul className="nav-links">
        <li onClick={() => setActiveTab('profile')}>Profile</li>
        <li onClick={() => setActiveTab('myCourses')}>My Courses</li>
        <li onClick={() => setActiveTab('newCourses')}>Register Courses</li>
      </ul>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
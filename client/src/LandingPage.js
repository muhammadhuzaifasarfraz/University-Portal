import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // <-- Importing the CSS file

const LandingPage = () => {
  return (
    <div className="landing-container">
      <h1>Welcome to the University Student Portal</h1>
      <p>Manage your profile, view your current courses, and register for new classes.</p>
      
      <div className="button-group">
        <Link to="/login">
          <button className="portal-btn">Login</button>
        </Link>
        <Link to="/signup">
          <button className="portal-btn">Sign Up</button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
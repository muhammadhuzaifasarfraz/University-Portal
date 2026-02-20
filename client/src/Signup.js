import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css'; 

const Signup = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    contact: '',
    email: '',
    password: ''
  });
  
  // New state to hold the specific field errors
  const [fieldErrors, setFieldErrors] = useState({
    firstname: '',
    lastname: ''
  });
  
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // The upgraded handleChange function
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 1. Check if the user is typing in a name field
    if (name === 'firstname' || name === 'lastname') {
      // This Regex only allows upper/lowercase letters and spaces
      const letterOnlyRegex = /^[a-zA-Z\s]*$/;

      if (!letterOnlyRegex.test(value)) {
        // If they type a number/symbol, show the error and DO NOT update the text box
        setFieldErrors({ ...fieldErrors, [name]: 'Please enter the valid perimeter' });
        return; 
      } else {
        // If it's a valid letter, clear the error immediately
        setFieldErrors({ ...fieldErrors, [name]: '' });
      }
    }

    // 2. Save the valid input to state
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      setMessage(res.data.message);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="signup-container">
      <h2>Student Registration</h2>
      <form className="signup-form" onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>First Name<span className="required-star">*</span></label><br />
          {/* We must bind the 'value' here so React can physically block bad typing */}
          <input type="text" name="firstname" value={formData.firstname} required onChange={handleChange} />
          {/* Conditional rendering for the pop message */}
          {fieldErrors.firstname && <span className="field-error">{fieldErrors.firstname}</span>}
        </div>
        
        <div className="form-group">
          <label>Last Name</label><br />
          <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} />
          {fieldErrors.lastname && <span className="field-error">{fieldErrors.lastname}</span>}
        </div>
        
        <div className="form-group">
          <label>Contact Number</label><br />
          <input type="text" name="contact" value={formData.contact} onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label>Email<span className="required-star">*</span></label><br />
          <input type="email" name="email" value={formData.email} required onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label>Password<span className="required-star">*</span></label><br />
          <input type="password" name="password" value={formData.password} required onChange={handleChange} />
        </div>
        
        <button className="submit-btn" type="submit">Sign Up</button>
      </form>
      
      {message && <p className="message-text">{message}</p>}
      
      <p>Already have an account? <Link to="/login">Login here</Link></p>
    </div>
  );
};

export default Signup;
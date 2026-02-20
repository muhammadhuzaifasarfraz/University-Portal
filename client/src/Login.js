import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('student', JSON.stringify(res.data.student));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      
      // This will now work because the input is "controlled" by state
      setFormData({ ...formData, password: '' }); 
    }
  };

  return (
    <div className="auth-container">
      <h2>Student Login</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label><br />
          <input 
            type="email" 
            name="email" 
            value={formData.email} // Add this
            required 
            onChange={handleChange} 
          />
        </div>
        <div className="form-group">
          <label>Password:</label><br />
          <input 
            type="password" 
            name="password" 
            value={formData.password} // Add this
            required 
            onChange={handleChange} 
          />
        </div>
        <button className="submit-btn" type="submit">Login</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
    </div>
  );
};

export default Login;
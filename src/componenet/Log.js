import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import logo from '../image/mutkehostel.png';
import bgImage from '../image/hostelbg.png';
import '../stylecss/LoginRegister.css';

const Log = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const navigate = useNavigate();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // Register State
  const [username, setUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);
        navigate('/maindashboard');
      } else {
        setLoginMessage('Invalid credentials');
      }
    } catch (error) {
      setLoginMessage('An error occurred. Please try again.');
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: registerEmail, password: registerPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setRegisterMessage('Registration successful! Please log in.');
        setIsLogin(true); // Redirect to login
      } else {
        setRegisterMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      setRegisterMessage('An error occurred. Please try again.');
    }
  };
  return (
    <div
  style={{
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    padding: '40px 0',
  }}
>
    <div className="container-fluid" >
      <div className="row">
        <div className="col-md-12 mt-0 d-flex">
        <img src={logo} alt="logo" style={{ height: '80px' }} />
         
        </div>
      </div>

      <div className="container">
  <center>
    
    <div className="auth-box" style={{ maxWidth: '600px', marginTop: '50px' }}>
      {isLogin ? (
        <>
          <h1
            style={{
              color: '#07226c',
              fontSize: '53px',
              marginBottom: '30px',
              fontWeight: '800',
            }}
          >
            Hos<span style={{color:'#ffc107'}}>tel</span> Paym<span style={{color:'#ffc107'}}>ent</span> <span style={{color:'#ffc107'}}>Man</span>agement <span style={{color:'#ffc107'}}>Sys</span>tem
          </h1>
          <form
            onSubmit={handleLogin}
            className="w-75"
            style={{
              border: '2px solid #2c3e50',
              padding: '40px 30px',
              borderRadius: '8px',
              backgroundColor:'#ffffff6e',
            }}
          >
            <div className="form-group text-start">
              <h3 style={{ color: '#1e3a8a', textAlign:'center' }}>Login </h3>
              <label>Email Address:</label>
              <div className="input-group">
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
               <span className="input-group-text">
                  <FaUser /> {/* Username Icon */}
                </span>
            </div>
            </div>
            <div className="form-group text-start">
              <label>Password:</label>
              <div className="input-group">
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
               <span className="input-group-text">
                  <FaLock /> {/* Password Icon */}
                </span>
            </div>
            </div>
            <button type="submit" className="back-btn btn" style={{backgroundColor:'#1e3a8a'}}>
              Login
            </button>
            {loginMessage && <p className="text-danger">{loginMessage}</p>}
          </form>
        </>
      ) : (
        <>
        <h1
            style={{
            color: '#07226c',
              fontSize: '53px',
              marginBottom: '30px',
              fontWeight: '800',
               
            }}
          >
            Hos<span style={{color:'#ffc107'}}>tel</span> Paym<span style={{color:'#ffc107'}}>ent</span> <span style={{color:'#ffc107'}}>Man</span>agement <span style={{color:'#ffc107'}}>Sys</span>tem
          </h1>
          
          <form
            onSubmit={handleRegister}
            className="w-75"
            style={{
              border: '2px solid black',
              padding: '20px',
              borderRadius: '8px',
              backgroundColor:'#ffffff6e',
            }}
          >
            <div className="form-group text-start">
              <h3 style={{ color: '#1e3a8a', textAlign:'center' }}>Register </h3>
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group text-start">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group text-start">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="back-btn btn btn-primary" style={{backgroundColor: '#07226c'}}>
              Register
            </button>
            {registerMessage && <p className="text-danger">{registerMessage}</p>}
          </form>
        </>
      )}
      <p>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button
          className="btn btn-link"
          onClick={() => setIsLogin(!isLogin)}
          style={{ textDecoration: 'none', paddingLeft: '5px' ,  color: '#07226c',fontWeight:'bolder' }}
        >
          {isLogin ? 'Register here' : 'Login here' }
        </button>
      </p>
    </div>
  </center>
</div>
    </div>
</div>
  );
};

export default Log;

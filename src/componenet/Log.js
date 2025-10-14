// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaUser, FaLock } from 'react-icons/fa';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
// import logo from '../image/mutkehostel.png';
// import bgImage from '../image/hostelbg.png';
// import '../stylecss/LoginRegister.css';

// const Log = () => {
//   const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
//   const navigate = useNavigate();

//   // Login State
//   const [loginEmail, setLoginEmail] = useState('');
//   const [loginPassword, setLoginPassword] = useState('');
//   const [loginMessage, setLoginMessage] = useState('');

//   // Register State
//   const [username, setUsername] = useState('');
//   const [registerEmail, setRegisterEmail] = useState('');
//   const [registerPassword, setRegisterPassword] = useState('');
//   const [registerMessage, setRegisterMessage] = useState('');

//   // Handle Login
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:8000/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: loginEmail, password: loginPassword }),
//       });

//       const data = await response.json();
//       if (response.ok && data.token) {
//         localStorage.setItem('authToken', data.token);
//         navigate('/maindashboard');
//       } else {
//         setLoginMessage('Invalid credentials');
//       }
//     } catch (error) {
//       setLoginMessage('An error occurred. Please try again.');
//     }
//   };

//   // Handle Register
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:8000/api/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, email: registerEmail, password: registerPassword }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setRegisterMessage('Registration successful! Please log in.');
//         setIsLogin(true); // Redirect to login
//       } else {
//         setRegisterMessage(data.message || 'Registration failed.');
//       }
//     } catch (error) {
//       setRegisterMessage('An error occurred. Please try again.');
//     }
//   };
//   return (
//     <div
//   style={{
//     backgroundImage: `url(${bgImage})`,
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//     minHeight: '100vh',
//     padding: '40px 0',
//   }}
// >
//     <div className="container-fluid" >
//       <div className="row">
//         <div className="col-md-12 mt-0 d-flex">
//         <img src={logo} alt="logo" style={{ height: '80px' }} />
         
//         </div>
//       </div>

//       <div className="container">
//   <center>
    
//     <div className="auth-box" style={{ maxWidth: '600px', marginTop: '50px' }}>
//       {isLogin ? (
//         <>
//           <h1
//             style={{
//               color: '#07226c',
//               fontSize: '53px',
//               marginBottom: '30px',
//               fontWeight: '800',
//             }}
//           >
//             Hos<span style={{color:'#ffc107'}}>tel</span> Paym<span style={{color:'#ffc107'}}>ent</span> <span style={{color:'#ffc107'}}>Man</span>agement <span style={{color:'#ffc107'}}>Sys</span>tem
//           </h1>
//           <form
//             onSubmit={handleLogin}
//             className="w-75"
//             style={{
//               border: '2px solid #2c3e50',
//               padding: '40px 30px',
//               borderRadius: '8px',
//               backgroundColor:'#ffffff6e',
//             }}
//           >
//             <div className="form-group text-start">
//               <h3 style={{ color: '#1e3a8a', textAlign:'center' }}>Login </h3>
//               <label>Email Address:</label>
//               <div className="input-group">
//               <input
//                 type="email"
//                 className="form-control"
//                 placeholder="Enter email"
//                 value={loginEmail}
//                 onChange={(e) => setLoginEmail(e.target.value)}
//                 required
//               />
//                <span className="input-group-text">
//                   <FaUser /> {/* Username Icon */}
//                 </span>
//             </div>
//             </div>
//             <div className="form-group text-start">
//               <label>Password:</label>
//               <div className="input-group">
//               <input
//                 type="password"
//                 className="form-control"
//                 placeholder="Enter password"
//                 value={loginPassword}
//                 onChange={(e) => setLoginPassword(e.target.value)}
//                 required
//               />
//                <span className="input-group-text">
//                   <FaLock /> {/* Password Icon */}
//                 </span>
//             </div>
//             </div>
//             <button type="submit" className="back-btn btn" style={{backgroundColor:'#1e3a8a'}}>
//               Login
//             </button>
//             {loginMessage && <p className="text-danger">{loginMessage}</p>}
//           </form>
//         </>
//       ) : (
//         <>
//         <h1
//             style={{
//             color: '#07226c',
//               fontSize: '53px',
//               marginBottom: '30px',
//               fontWeight: '800',
               
//             }}
//           >
//             Hos<span style={{color:'#ffc107'}}>tel</span> Paym<span style={{color:'#ffc107'}}>ent</span> <span style={{color:'#ffc107'}}>Man</span>agement <span style={{color:'#ffc107'}}>Sys</span>tem
//           </h1>
          
//           <form
//             onSubmit={handleRegister}
//             className="w-75"
//             style={{
//               border: '2px solid black',
//               padding: '20px',
//               borderRadius: '8px',
//               backgroundColor:'#ffffff6e',
//             }}
//           >
//             <div className="form-group text-start">
//               <h3 style={{ color: '#1e3a8a', textAlign:'center' }}>Register </h3>
//               <label>Username</label>
//               <input
//                 type="text"
//                 className="form-control"
//                 placeholder="Enter username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="form-group text-start">
//               <label>Email Address</label>
//               <input
//                 type="email"
//                 className="form-control"
//                 placeholder="Enter email"
//                 value={registerEmail}
//                 onChange={(e) => setRegisterEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="form-group text-start">
//               <label>Password</label>
//               <input
//                 type="password"
//                 className="form-control"
//                 placeholder="Enter password"
//                 value={registerPassword}
//                 onChange={(e) => setRegisterPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <button type="submit" className="back-btn btn btn-primary" style={{backgroundColor: '#07226c'}}>
//               Register
//             </button>
//             {registerMessage && <p className="text-danger">{registerMessage}</p>}
//           </form>
//         </>
//       )}
//       <p>
//         {isLogin ? "Don't have an account?" : 'Already have an account?'}
//         <button
//           className="btn btn-link"
//           onClick={() => setIsLogin(!isLogin)}
//           style={{ textDecoration: 'none', paddingLeft: '5px' ,  color: '#07226c',fontWeight:'bolder' }}
//         >
//           {isLogin ? 'Register here' : 'Login here' }
//         </button>
//       </p>
//     </div>
//   </center>
// </div>
//     </div>
// </div>
//   );
// };

// export default Log;



// Log.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../image/mutkehostel.png";
import bgImage from "../image/hostelbg.png";
import "../stylecss/LoginRegister.css";

// If you already have a tenantApi file exporting API and setToken, import it.
// Otherwise, uncomment the simple fallback setToken below.
// import { API, setToken } from "../tenantApi";
const API = process.env.REACT_APP_API_BASE || "http://localhost:8000/api"; // fallback
const setToken = (t) => localStorage.setItem("tenantToken", t);

// Inline TenantLogin (from your snippet, lightly styled to match the page)
function TenantLoginInline({ onLoggedIn }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);

  const box = {
    maxWidth: 520,
    margin: "0 auto",
    background: "#ffffff6e",
    padding: "24px 24px",
    borderRadius: 8,
    border: "2px solid #2c3e50",
  };
  const label = { fontSize: 13, color: "#1f2937", marginBottom: 6, textAlign: "left" };
  const input = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    outline: "none",
    marginBottom: 12,
    background: "#fff",
  };
  const btnPri = {
    width: "100%",
    padding: "10px 14px",
    border: 0,
    borderRadius: 8,
    background: "#1e3a8a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };
  const btnSec = { ...btnPri, background: "#16a34a" };

  async function reqOtp() {
    if (!phone) return alert("Enter phone number");
    try {
      setBusy(true);
      const r = await axios.post(`${API}/tenant/auth/request-otp`, { phone });
      if (r.data?.devCode) setDevCode(r.data.devCode);
      setStep(2);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to request OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!otp) return alert("Enter OTP");
    try {
      setBusy(true);
      const r = await axios.post(`${API}/tenant/auth/verify`, { phone, code: otp });
      setToken(r.data.token);
      onLoggedIn && onLoggedIn();
    } catch (e) {
      alert(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={box}>
      <h3 style={{ margin: 0, marginBottom: 16, textAlign: "center", color: "#07226c" }}>
        Tenant Login
      </h3>
      {step === 1 && (
        <>
          <div style={label}>Phone</div>
          <input
            style={input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
          <button disabled={busy} style={btnPri} onClick={reqOtp}>
            {busy ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <div style={label}>Enter OTP</div>
          <input
            style={input}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
          />
          <button disabled={busy} style={btnSec} onClick={verify}>
            {busy ? "Verifying..." : "Verify"}
          </button>
          {devCode && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
              Dev OTP: <b>{devCode}</b>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const Log = () => {
  const [role, setRole] = useState("admin"); // "admin" | "tenant"
  const [isLogin, setIsLogin] = useState(true); // only for admin section
  const navigate = useNavigate();

  // Admin Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  // Admin Register State
  const [username, setUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  // Admin: Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("authToken", data.token);
        navigate("/maindashboard");
      } else {
        setLoginMessage(data?.message || "Invalid credentials");
      }
    } catch (error) {
      setLoginMessage("An error occurred. Please try again.");
    }
  };

  // Admin: Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email: registerEmail, password: registerPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setRegisterMessage("Registration successful! Please log in.");
        setIsLogin(true);
      } else {
        setRegisterMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      setRegisterMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        padding: "40px 0",
      }}
    >
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12 mt-0 d-flex">
            <img src={logo} alt="logo" style={{ height: "80px" }} />
          </div>
        </div>

        <div className="container">
          <center>
            <div className="auth-box" style={{ maxWidth: "800px", marginTop: "50px" }}>
              {/* App Title */}
              <h1
                style={{
                  color: "#07226c",
                  fontSize: "42px",
                  marginBottom: "22px",
                  fontWeight: 800,
                }}
              >
                Hos<span style={{ color: "#ffc107" }}>tel</span> Paym
                <span style={{ color: "#ffc107" }}>ent</span>{" "}
                <span style={{ color: "#ffc107" }}>Man</span>agement{" "}
                <span style={{ color: "#ffc107" }}>Sys</span>tem
              </h1>

              {/* Role Switch */}
              <div className="btn-group mb-3" role="group" aria-label="Role switch">
                <button
                  className={`btn ${role === "admin" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setRole("admin")}
                >
                  Admin
                </button>
                <button
                  className={`btn ${role === "tenant" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setRole("tenant")}
                >
                  Tenant
                </button>
              </div>

              {/* ADMIN VIEW */}
              {role === "admin" && (
                <>
                  {isLogin ? (
                    <form
                      onSubmit={handleLogin}
                      className="w-75"
                      style={{
                        border: "2px solid #2c3e50",
                        padding: "32px 28px",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff6e",
                        margin: "0 auto",
                      }}
                    >
                      <div className="form-group text-start">
                        <h3 style={{ color: "#1e3a8a", textAlign: "center" }}>Admin Login</h3>
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
                            <FaUser />
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
                            <FaLock />
                          </span>
                        </div>
                      </div>

                      <button type="submit" className="back-btn btn" style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
                        Login
                      </button>
                      {loginMessage && <p className="text-danger mt-2">{loginMessage}</p>}
                    </form>
                  ) : (
                    <form
                      onSubmit={handleRegister}
                      className="w-75"
                      style={{
                        border: "2px solid black",
                        padding: "24px 20px",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff6e",
                        margin: "0 auto",
                      }}
                    >
                      <div className="form-group text-start">
                        <h3 style={{ color: "#1e3a8a", textAlign: "center" }}>Register</h3>
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
                      <button type="submit" className="back-btn btn btn-primary" style={{ backgroundColor: "#07226c" }}>
                        Register
                      </button>
                      {registerMessage && <p className="text-danger mt-2">{registerMessage}</p>}
                    </form>
                  )}

                  {/* Admin Login/Register toggle */}
                  <p className="mt-3">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      className="btn btn-link"
                      onClick={() => setIsLogin(!isLogin)}
                      style={{ textDecoration: "none", paddingLeft: 5, color: "#07226c", fontWeight: "bolder" }}
                    >
                      {isLogin ? "Register here" : "Login here"}
                    </button>
                  </p>
                </>
              )}

              {/* TENANT VIEW */}
              {role === "tenant" && (
                <TenantLoginInline onLoggedIn={() => navigate("tenant")} />
              )}
            </div>
          </center>
        </div>
      </div>
    </div>
  );
};

export default Log;

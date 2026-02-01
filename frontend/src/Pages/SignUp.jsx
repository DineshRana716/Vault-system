import React from "react";
import { signup } from "../Services/authApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handlesubmit = async (e) => {
    e.preventDefault();
    try {
      await signup({ email, password });
      navigate("/");
    } catch (err) {}
  };

  return (
    <div>
      <div className="container">
        <div className="wrapper">
          <div className="title">
            <span>Welcome</span>
          </div>
          <p className="title_para">Please enter your details to sign up.</p>

          <form onSubmit={handlesubmit}>
            <div className="row">
              {/* <i className="fas fa-user"></i> */}
              <input type="text" placeholder="Enter your email..." required />
            </div>
            <div className="row">
              {/* <i className="fas fa-lock"></i> */}
              <input type="password" placeholder="Password" required />
            </div>
            <div className="pass">
              <a href="#">Forgot password?</a>
            </div>
            <div className="row button">
              <input type="submit" value="Login" />
            </div>
            <div className="signup-link">
              Already a member? <a href="#">Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

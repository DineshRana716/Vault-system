import React from "react";
import { signup } from "../Services/authApi";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import style from "./Form.module.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handlesubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await signup({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div>
      <div className={style.container}>
        <div className={style.wrapper}>
          <div className={style.title}>
            <span>Sign Up</span>
          </div>

          <p className={style.title_para}>
            Please enter your details to sign up.
          </p>

          <form onSubmit={handlesubmit}>
            <div className={style.row}>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                required
              />
            </div>

            <div className={style.row}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>

            <div className={style.row}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>

            {error && <p className={style.error}>{error}</p>}

            <div className={`${style.row} ${style.button}`}>
              <input type="submit" value="Sign Up" />
            </div>

            <div className={style.signupLink}>
              Already a member? <Link to="/">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

import React from "react";
import { signup } from "../Services/authApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "./Form.module.css";

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
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div>
      <div className={style.container}>
        <div className={style.wrapper}>
          <div className={style.title}>
            <span>Welcome</span>
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

            <div className={style.pass}>
              <a href="#">Forgot password?</a>
            </div>

            <div className={`${style.row} ${style.button}`}>
              <input type="submit" value="Login" />
            </div>

            <div className={style.signupLink}>
              Already a member? <a href="#">Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

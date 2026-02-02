import React from "react";
import style from "./Form.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });

      // 🔐 store token
      localStorage.setItem("token", res.data.token);

      // go to protected page
      navigate("/files");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };
  return (
    <div className={style.container}>
      <div className={style.wrapper}>
        <div className={style.title}>
          <span>Welcome back</span>
        </div>

        <p className={style.title_para}>
          Please enter your details to sign in.
        </p>

        <form>
          <div className={style.row}>
            <input type="text" placeholder="Enter your email..." required />
          </div>

          <div className={style.row}>
            <input type="password" placeholder="Password" required />
          </div>

          <div className={style.pass}>
            <a href="#">Forgot password?</a>
          </div>

          <div className={`${style.row} ${style.button}`}>
            <input type="submit" value="Login" />
          </div>

          <div className={style.signupLink}>
            Not a member? <a href="#">Signup now</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

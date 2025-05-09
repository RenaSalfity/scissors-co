import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Login.css";

function Login({ setUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Define Validation Function ONCE (Used for both frontend & backend validation)
  const validateInput = () => {
    if (isSignUp) {
      if (!/^[A-Za-z]{2,}$/.test(name)) {
        return "Name must contain at least 2 letters and only letters.";
      }
      if (!/^05\d{8}$/.test(phone)) {
        return "Phone number must be exactly 10 digits and start with '05'.";
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        return "Invalid email format.";
      }
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{3,8}$/.test(password)) {
        return "Password must be 3-8 characters long and contain at least one letter and one number.";
      }
    } else {
      // ✅ Login only checks email format (password check is done against DB)
      if (!/\S+@\S+\.\S+/.test(email)) {
        return "Invalid email format.";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Run validation before sending request
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignUp
      ? {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }
      : { email, password };

    try {
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred. Please try again.");
        return;
      }

      if (isSignUp) {
        alert("Signup successful! Please log in.");
        setIsSignUp(false);
      } else {
        sessionStorage.setItem("user", JSON.stringify(data));
        setUser(data);
        navigate(
          data.role === "Customer"
            ? "/customer"
            : data.role === "Admin"
            ? "/admin"
            : "/employee"
        );
      }
    } catch (error) {
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">
        {isSignUp ? "Sign Up" : "Login"} to Scissors&Co
      </h1>
      {error && <p className="error">{error}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
        <div
          className="form-group"
          style={{ display: isSignUp ? "block" : "none" }}
        >
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={isSignUp}
          />
        </div>
        <div
          className="form-group"
          style={{ display: isSignUp ? "block" : "none" }}
        >
          <label>Phone Number</label>
          <input
            type="text"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required={isSignUp}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-btn">
          {isSignUp ? "Sign Up" : "Login"}
        </button>
      </form>
      <p className="login-footer">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <span className="toggle-link" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Login" : "Sign Up"}
        </span>
      </p>
    </div>
  );
}

export default Login;

//// qkhalilieh@gmail.com   1234567q
//qasem@scissorsco.com - qasem123
//rena@hotmail.com - rena1999

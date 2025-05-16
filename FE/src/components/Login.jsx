import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Login.css";

function Login({ setUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✨ Email verification states
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

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
      if (!/\S+@\S+\.\S+/.test(email)) {
        return "Invalid email format.";
      }
    }
    return null;
  };

  const sendVerificationCode = async () => {
    setError("");
    if (!email) {
      setError("Enter your email first.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to send code");

      setCodeSent(true);
      alert("Verification code sent to your email.");
    } catch (err) {
      setError("Failed to send code.");
    }
  };

  const verifyEnteredCode = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyCode }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || "Invalid code");

      setIsVerified(true);
      alert("Email verified! Now you can finish signing up.");
    } catch (err) {
      setError("Failed to verify code.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isSignUp && !isVerified) {
      setError("Please verify your email before signing up.");
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
        {/* Sign Up fields */}
        {isSignUp && (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </>
        )}
        {/* Always show email */}

        <div className="form-group">
          <label>Email</label>
          {/* after pressing send verification button iam locking the section of the
          email bc they can change it */}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={codeSent}
          />
        </div>
        {/* Email verification for signup */}
        {isSignUp && !isVerified && (
          <>
            <div className="form-group">
              <button
                type="button"
                className="login-btn"
                onClick={sendVerificationCode}
              >
                Send Verification Code
              </button>
            </div>
            {codeSent && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter the code sent to your email"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="login-btn"
                  onClick={verifyEnteredCode}
                >
                  Verify Code
                </button>
              </>
            )}
          </>
        )}
        {/* Password field */}
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
        {/* Submit */}
        <button type="submit" className="login-btn">
          {isSignUp ? "Sign Up" : "Login"}
        </button>
      </form>

      <p className="login-footer">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <span
          className="toggle-link"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setIsVerified(false);
            setCodeSent(false);
            setVerifyCode("");
          }}
        >
          {isSignUp ? "Login" : "Sign Up"}
        </span>
      </p>
    </div>
  );
}

export default Login;

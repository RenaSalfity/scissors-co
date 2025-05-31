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

  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetVerified, setResetVerified] = useState(false);

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

  // 🔁 Forgot password handlers
  const handleSendResetCode = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/password-reset/send-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setResetCodeSent(true);
      alert("Code sent to email.");
    } catch {
      setError("Failed to send code");
    }
  };

  const handleVerifyResetCode = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/password-reset/verify-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail, code: resetCode }),
        }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setResetVerified(true);
      alert("Code verified. Enter new password.");
    } catch {
      setError("Verification failed");
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/password-reset/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail, newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      alert("Password updated. You can now login.");
      setForgotMode(false);
    } catch {
      setError("Reset failed");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">
        {isSignUp ? "Sign Up" : "Login"} to Scissors&Co
      </h1>
      {error && <p className="error">{error}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPassword(""); // 🔒 Clear password when email changes
            }}
            required
            disabled={codeSent && isSignUp}
          />
        </div>

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

      {!isSignUp && !forgotMode && (
        <p className="login-footer">
          <span className="toggle-link" onClick={() => setForgotMode(true)}>
            Forgot Password?
          </span>
        </p>
      )}

      {forgotMode && (
        <div className="forgot-section">
          <h3>Reset Password</h3>
          {!resetCodeSent && (
            <>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <button className="login-btn" onClick={handleSendResetCode}>
                Send Code
              </button>
            </>
          )}
          {resetCodeSent && !resetVerified && (
            <>
              <input
                type="text"
                placeholder="Enter code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
              />
              <button className="login-btn" onClick={handleVerifyResetCode}>
                Verify Code
              </button>
            </>
          )}
          {resetVerified && (
            <>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="login-btn" onClick={handleResetPassword}>
                Set New Password
              </button>
            </>
          )}
        </div>
      )}

      <p className="login-footer">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <span
          className="toggle-link"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setIsVerified(false);
            setCodeSent(false);
            setVerifyCode("");
            setForgotMode(false);
          }}
        >
          {isSignUp ? "Login" : "Sign Up"}
        </span>
      </p>
    </div>
  );
}

export default Login;

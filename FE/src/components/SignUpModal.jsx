import React, { useState } from "react";
import axios from "axios";
import "../assets/styles/SignUpModal.css";

function SignUpModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✨ Verification states
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const validateInput = () => {
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
    return null;
  };

  const sendVerificationCode = async () => {
    setError("");
    if (!email) {
      setError("Enter your email first.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5001/api/send-code", {
        email,
      });
      setCodeSent(true);
      alert("Verification code sent to your email.");
    } catch (err) {
      console.error("Send code error:", err);
      setError("Failed to send code.");
    }
  };

  const verifyEnteredCode = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/verify-code", {
        email,
        code: verifyCode,
      });

      if (res.data.verified) {
        setIsVerified(true);
        alert("Email verified! You can now sign up.");
      } else {
        setError("Incorrect verification code.");
      }
    } catch (err) {
      setError("Verification failed.");
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

    if (!isVerified) {
      setError("Please verify your email first.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/signup",
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }
      );

      alert("Signup successful!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Signup failed:", err);
      const msg = err.response?.data?.error || "Signup failed. Try again.";
      setError(msg);
    }
  };

  return (
    <div className="signup-modal-backdrop">
      <div className="signup-modal">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={codeSent}
          />

          {/* Email verification */}
          {!isVerified && (
            <>
              <button type="button" onClick={sendVerificationCode}>
                Send Verification Code
              </button>
              {codeSent && (
                <>
                  <input
                    type="text"
                    placeholder="Enter Code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                  />
                  <button type="button" onClick={verifyEnteredCode}>
                    Verify Code
                  </button>
                </>
              )}
            </>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={!isVerified}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUpModal;

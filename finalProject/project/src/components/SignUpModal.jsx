
import React, { useState } from "react";
import axios from "axios";
import "../assets/styles/SignUpModal.css";

function SignUpModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5001/api/auth/signup", {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password
      });

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
        <button className="close-btn" onClick={onClose}>×</button>
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
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Sign Up</button>
        </form>
      </div>
    </div>
  );
}

export default SignUpModal;

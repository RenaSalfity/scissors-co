import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Contact.css";

function Contact() {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/users?role=Admin")
      .then((res) => setAdmins(res.data))
      .catch((err) => {
        console.error("Failed to load admin contacts:", err);
        setAdmins([]);
      });
  }, []);

  return (
    <div className="main">
      <div className="contact-container">
        <h1 className="contact-title">Contact Us</h1>

        {admins.length === 0 && <p>No admin contacts found.</p>}

        {admins.map((admin) => (
          <div key={admin.id} className="contact-text">
            <span>{admin.name}:</span>
            <span className="contact-name">📞{admin.phone}</span>
          </div>
        ))}

        <div className="contact-image">{/* Optional image here */}</div>
      </div>
    </div>
  );
}

export default Contact;

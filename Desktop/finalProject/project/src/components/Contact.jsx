import React from "react";
import "../assets/styles/Contact.css"; // Add a CSS file for Contact styles

function Contact() {
  return (
    <div className="contact-container">
      <h1 className="contact-title">Contact Us</h1>
      <p className="contact-text">
        Qasem Khalilieh: <span className="contact-name">📞052-6114905</span>
      </p>
      <p className="contact-text">
        Rena Salfity: <span className="contact-name">📞058-5110220</span>
      </p>
      <div className="contact-image">
        {/* <img
          src="https://via.placeholder.com/600x400"
          alt="Contact"
          className="image"
        /> */}
      </div>
    </div>
  );
}

export default Contact;

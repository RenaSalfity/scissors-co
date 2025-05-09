import React from "react";
import "../assets/styles/About.css";

function About() {
  return (
    <div className="about-container">
      <h1 className="about-title">Welcome to Scissors&Co.</h1>
      <p className="about-description">
        Scissors&Co is a web-based appointment scheduling system designed for
        beauty salons and barbershops. Developed by programmers Qasem and Rena,
        our goal is to provide a seamless and efficient booking experience for
        both clients and salon staff.
      </p>
      <div className="about-image">
        {/* <img
          src="https://via.placeholder.com/600x400"
          alt="Scissors and Co."
          className="image"
        /> */}
      </div>
      <div className="about-highlights">
        <h2>Why Choose Us?</h2>
        <ul>
          <li>Effortless online appointment scheduling.</li>
          <li>Streamlined experience for both clients and staff.</li>
          <li>Designed to cater to beauty salons and barbershops alike.</li>
        </ul>
      </div>
    </div>
  );
}

export default About;

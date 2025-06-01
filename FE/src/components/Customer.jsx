import React, { useEffect, useState } from "react";
import axios from "axios";
import CategoryCarousel from "./CategoryCarousel";
import "../assets/styles/MainPage.css";

function Customer({ user }) {
  const [categories, setCategories] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    if (!user) return;

    axios
      .get(`http://localhost:5001/api/appointments?customerId=${user.id}`)
      .then((res) => {
        const now = new Date();
        const upcoming = res.data
          .filter((appt) => {
            if (appt.status?.toLowerCase() !== "pending") return false;

            // Get the full datetime object
            const [hour, minute] = appt.time.split(":").map(Number);
            const apptDate = new Date(appt.date);
            apptDate.setHours(hour, minute, 0, 0); // Set precise time

            return apptDate > now;
          })
          .sort((a, b) => {
            const d1 = new Date(`${a.date}T${a.time.slice(0, 5)}`);
            const d2 = new Date(`${b.date}T${b.time.slice(0, 5)}`);
            return d1 - d2;
          });

        setAppointments(upcoming);
      })
      .catch((err) => console.error("Error fetching appointments:", err));
  }, [user]);

  if (!user) return null;

  return (
    <div className="customer-container">
      <div className="main customer-layout">
        <div className="service-section">
          <h1 className="main-page-title">Choose a Service</h1>
          <CategoryCarousel
            categories={categories}
            role="Customer"
            buttonLabel="Choose Service"
          />
        </div>

        <div className="upcoming-box">
          <h2>📅 Upcoming Appointments</h2>
          {appointments.length === 0 ? (
            <p>No upcoming appointments.</p>
          ) : (
            <ul className="upcoming-list">
              {appointments.map((appt) => (
                <li key={appt.id} className="appt-card">
                  <div>
                    <strong>{appt.service_name}</strong>
                  </div>
                  <div>
                    {new Date(appt.date).toLocaleDateString("en-GB")} –{" "}
                    {appt.time.slice(0, 5)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customer;

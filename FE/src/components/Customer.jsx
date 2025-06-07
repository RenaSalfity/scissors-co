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
    fetchAppointments();
  }, [user]);

  const fetchAppointments = () => {
    axios
      .get(`http://localhost:5001/api/appointments?customerId=${user.id}`)
      .then((res) => {
        const now = new Date();
        const upcoming = res.data
          .filter((appt) => {
            if (appt.status?.toLowerCase() !== "pending") return false;

            const [hour, minute] = appt.time.split(":").map(Number);
            const apptDate = new Date(appt.date);
            apptDate.setHours(hour, minute, 0, 0);

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
  };

  const handleCancelAppointment = async (appointmentId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );
    if (!confirmCancel) return;

    try {
      await axios.put(
        `http://localhost:5001/api/appointments/${appointmentId}/cancel`,
        {
          role: user.role,
          userId: user.id,
        }
      );
      fetchAppointments();
      alert("Appointment cancelled successfully.");
    } catch (err) {
      console.error("Cancellation failed:", err);
      alert("Failed to cancel appointment. Please try again.");
    }
  };
  

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
                  <div className="appt-card-row">
                    <span className="appt-service">{appt.service_name}</span>
                    <button
                      className="cancel-inline-btn"
                      onClick={() => handleCancelAppointment(appt.id)}
                    >
                      Cancel Appointment.
                    </button>
                  </div>
                  <div className="appt-time">
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

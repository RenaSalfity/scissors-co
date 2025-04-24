import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../assets/styles/BookingPage.css";

function BookingPage({ user }) {
  const location = useLocation();
  const preselectedService = location.state?.service || null;

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
  });
  const [filteredTimes, setFilteredTimes] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchEmployees();

    if (preselectedService) {
      setForm((prev) => {
        const updated = { ...prev, serviceId: preselectedService.id };
        if (updated.employeeId && updated.date) {
          fetchAvailableTimes(
            updated.serviceId,
            updated.employeeId,
            updated.date
          );
        }
        return updated;
      });
    }
  }, []);

  const fetchServices = () => {
    axios
      .get("http://localhost:5001/api/services")
      .then((res) => setServices(res.data))
      .catch((err) => console.error("Error loading services:", err));
  };

  const fetchEmployees = () => {
    axios
      .get("http://localhost:5001/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error loading employees:", err));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    // Include preselected serviceId if missing
    if (!updatedForm.serviceId && preselectedService) {
      updatedForm.serviceId = preselectedService.id;
    }

    setForm(updatedForm);

    const { serviceId, employeeId, date } = updatedForm;
    if (serviceId && employeeId && date) {
      fetchAvailableTimes(serviceId, employeeId, date);
    }
  };

  const fetchAvailableTimes = (serviceId, employeeId, date) => {
    axios
      .get(
        `http://localhost:5001/api/available-times?serviceId=${serviceId}&employeeId=${employeeId}&date=${date}`
      )
      .then((res) => setFilteredTimes(res.data))
      .catch((err) => console.error("Failed to load times:", err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, customerEmail: user.email };

    axios
      .post("http://localhost:5001/api/appointments", payload)
      .then(() => {
        alert("Appointment booked!");
        setForm({ serviceId: "", employeeId: "", date: "", time: "" });
        setFilteredTimes([]);
      })
      .catch((err) => {
        console.error("Failed to book appointment:", err);
        alert("Booking failed.");
      });
  };

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  const minDateStr = today.toISOString().split("T")[0];
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="booking-page">
      <h2>Book Your Appointment</h2>

      <form className="booking-form" onSubmit={handleSubmit}>
        {preselectedService ? (
          <select disabled className="locked-select">
            <option>
              {preselectedService.name} – ₪{preselectedService.price}
            </option>
          </select>
        ) : (
          <select
            name="serviceId"
            value={form.serviceId}
            onChange={handleFormChange}
            required
          >
            <option value="">Choose Service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} – ₪{s.price}
              </option>
            ))}
          </select>
        )}

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleFormChange}
          min={minDateStr}
          max={maxDateStr}
          required
        />

        <select
          name="employeeId"
          value={form.employeeId}
          onChange={handleFormChange}
          required
        >
          <option value="">Choose Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <select
          name="time"
          value={form.time}
          onChange={handleFormChange}
          required
        >
          <option value="">Choose Time</option>
          {filteredTimes.map((time, i) => (
            <option key={i} value={time}>
              {time}
            </option>
          ))}
        </select>

        <button type="submit">Book Appointment</button>
      </form>
    </div>
  );
}

export default BookingPage;

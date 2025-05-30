import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../assets/styles/BookingPage.css";

function BookingPage({ user }) {
  const location = useLocation();
  const preselectedService = location.state?.service || null;

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredTimes, setFilteredTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    fetchServices();

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

  const fetchAvailableEmployees = (date) => {
    axios
      .get("http://localhost:5001/api/employees/available", {
        params: { date },
      })
      .then((res) => {
        const filtered = res.data.filter((emp) => emp.id !== user.id);
        setEmployees(filtered);
      })
      .catch((err) => {
        console.error("Error loading available employees:", err);
        setEmployees([]);
      });
  };

  const fetchAvailableTimes = (serviceId, employeeId, rawDate) => {
    const normalizedDate = new Date(rawDate).toISOString().split("T")[0];

    console.log("📅 Fetching slots for:", {
      serviceId,
      employeeId,
      date: normalizedDate,
    });

    axios
      .get("http://localhost:5001/api/available-times", {
        params: {
          serviceId,
          employeeId,
          date: normalizedDate,
        },
      })
      .then((res) => setFilteredTimes(res.data))
      .catch((err) => {
        console.error("Failed to load times:", err);
        setFilteredTimes([]);
      });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    if (!updatedForm.serviceId && preselectedService) {
      updatedForm.serviceId = preselectedService.id;
    }

    setForm(updatedForm);

    if (name === "date" && value) {
      fetchAvailableEmployees(value);
    }

    const { serviceId, employeeId, date } = updatedForm;
    if (serviceId && employeeId && date) {
      fetchAvailableTimes(serviceId, employeeId, date);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...form, customerEmail: user.email };

    try {
      await axios.post("http://localhost:5001/api/appointments", payload);
      alert("Appointment booked!");
      setForm({ serviceId: "", employeeId: "", date: "", time: "" });
      setFilteredTimes([]);
      setEmployees([]);
    } catch (err) {
      console.error("Failed to book appointment:", err);
      alert("Booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const minDateStr = today.toISOString().split("T")[0];

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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}

export default BookingPage;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../assets/styles/BookingPage.css";
import { useNavigate } from "react-router-dom";

function BookingPage({ user }) {
  const location = useLocation();
  const preselectedService = location.state?.service || null;
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allowedEmployeeIds, setAllowedEmployeeIds] = useState([]);
  const [filteredTimes, setFilteredTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closedDays, setClosedDays] = useState([]);
  const [specialOverride, setSpecialOverride] = useState({});
  const [form, setForm] = useState({
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [minDateStr, setMinDateStr] = useState(todayStr);

  useEffect(() => {
    fetchServices();
    fetchClosedDays();

    if (preselectedService) {
      fetchAllowedEmployees(preselectedService.id);
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

  const fetchClosedDays = () => {
    axios
      .get("http://localhost:5001/api/business-hours/closed-days")
      .then((res) => {
        setClosedDays(res.data.closedDays || []);
        setSpecialOverride(res.data.specialOverride || {});

        const specialToday = res.data.specialOverride?.[todayStr];
        let allowToday = true;

        if (
          specialToday &&
          !specialToday.start_time &&
          !specialToday.end_time
        ) {
          allowToday = false;
        } else if (!specialToday) {
          const todayName = today.toLocaleString("en-US", { weekday: "long" });
          if (res.data.closedDays?.includes(todayName)) {
            allowToday = false;
          }
        } else if (specialToday.end_time) {
          const [h, m] = specialToday.end_time.split(":").map(Number);
          const closingTime = new Date(today);
          closingTime.setHours(h, m, 0, 0);
          if (today >= closingTime) {
            allowToday = false;
          }
        }

        if (!allowToday) {
          const nextDay = new Date();
          nextDay.setDate(today.getDate() + 1);
          setMinDateStr(nextDay.toISOString().split("T")[0]);
        }
      })
      .catch((err) => console.error("❌ Failed to fetch closed days", err));
  };

  const fetchAllowedEmployees = (serviceId) => {
    axios
      .get(`http://localhost:5001/api/service-employees/${serviceId}`)
      .then((res) => setAllowedEmployeeIds(res.data.employeeIds || []))
      .catch((err) => {
        console.error("Error fetching assigned employees:", err);
        setAllowedEmployeeIds([]);
      });
  };

  const fetchAvailableEmployees = (date) => {
    axios
      .get("http://localhost:5001/api/employees/available", {
        params: { date },
      })
      .then((res) => {
        const filtered = res.data
          .filter((emp) => emp.id !== user.id)
          .filter((emp) => allowedEmployeeIds.includes(emp.id));
        setEmployees(filtered);
      })
      .catch((err) => {
        console.error("Error loading available employees:", err);
        setEmployees([]);
      });
  };

  const fetchAvailableTimes = (serviceId, employeeId, rawDate) => {
    const normalizedDate = new Date(rawDate).toISOString().split("T")[0];
    axios
      .get("http://localhost:5001/api/available-times", {
        params: { serviceId, employeeId, date: normalizedDate },
      })
      .then((res) => setFilteredTimes(res.data))
      .catch((err) => {
        console.error("Failed to load times:", err);
        setFilteredTimes([]);
      });
  };

  const isTimeInPast = (dateStr, timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const selected = new Date(dateStr);
    selected.setHours(h, m, 0, 0);
    return selected < new Date();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    if (!updatedForm.serviceId && preselectedService) {
      updatedForm.serviceId = preselectedService.id;
    }

    if (name === "serviceId") {
      fetchAllowedEmployees(value);
      setForm({ ...updatedForm, employeeId: "", time: "" });
      setEmployees([]);
      setFilteredTimes([]);
      return;
    }

    setForm(updatedForm);

    if (name === "date" && value) {
      fetchAvailableEmployees(value);
    }

    const { serviceId, employeeId, date } = updatedForm;
    if (serviceId && employeeId && date) {
      fetchAvailableTimes(serviceId, employeeId, date);
    }

    if (
      name === "time" &&
      updatedForm.date &&
      isTimeInPast(updatedForm.date, value)
    ) {
      alert("You cannot select a past time.");
      setForm((prev) => ({ ...prev, time: "" }));
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

  return (
    <div className="booking-page">
      <h2>Book Your Appointment</h2>
      <button
        type="button"
        className="back-btn"
        onClick={() =>
          navigate(`/post/${preselectedService.category_id}`, {
            state: { post: preselectedService },
          })
        }
      >
        ← Back to Services
      </button>
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
          {employees.length > 0 ? (
            employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))
          ) : (
            <option disabled value="">
              No employees available
            </option>
          )}
        </select>

        <select
          name="time"
          value={form.time}
          onChange={handleFormChange}
          required
        >
          <option value="">Choose Time</option>
          {filteredTimes
            .filter((time) => !isTimeInPast(form.date, time))
            .map((time, i) => (
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

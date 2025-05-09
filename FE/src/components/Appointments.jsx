import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Appointments.css";
import SignUpModal from "./SignUpModal"; // ✅ Modal signup component

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [viewMode, setViewMode] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [emailExists, setEmailExists] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const [form, setForm] = useState({
    customerEmail: "",
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    fetchAppointments();
  }, [viewMode]);

  useEffect(() => {
    fetchCategories();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchServicesByCategory(selectedCategory);
    } else {
      setServices([]);
    }
  }, [selectedCategory]);

  const fetchAppointments = () => {
    axios
      .get(`http://localhost:5001/api/appointments?view=${viewMode}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error("Failed to fetch appointments:", err));
  };

  const handleFilterByDate = () => {
    if (!startDate || !endDate) return;
    axios
      .get(
        `http://localhost:5001/api/appointments?start=${startDate}&end=${endDate}`
      )
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error("Failed to filter appointments:", err));
  };

  const fetchCategories = () => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories:", err));
  };

  const fetchServicesByCategory = (categoryId) => {
    axios
      .get(`http://localhost:5001/services/${categoryId}`)
      .then((res) => setServices(res.data))
      .catch((err) => console.error("Failed to load services:", err));
  };

  const fetchEmployees = () => {
    axios
      .get("http://localhost:5001/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Failed to load employees:", err));
  };

  const checkCustomerEmail = () => {
    const email = form.customerEmail.trim();
    if (!email) return;

    axios
      .get(`http://localhost:5001/api/users/check-email?email=${email}`)
      .then((res) => {
        setEmailExists(res.data.exists);
      })
      .catch((err) => {
        console.error("Error checking email:", err);
        setEmailExists(true); // safe fallback
      });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAppointment = () => {
    axios
      .post("http://localhost:5001/api/appointments", form)
      .then(() => {
        alert("Appointment created!");
        fetchAppointments();
        setForm({
          customerEmail: "",
          serviceId: "",
          employeeId: "",
          date: "",
          time: "",
        });
        setSelectedCategory("");
        setServices([]);
        setEmailExists(true);
      })
      .catch((err) => console.error("Failed to create appointment:", err));
  };

  return (
    <div className="appointments-screen">
      <h1>Manage Appointments</h1>

      {/* Filters */}
      <div className="filters">
        <label>View Mode:</label>
        <select onChange={(e) => setViewMode(e.target.value)} value={viewMode}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="year">Yearly</option>
        </select>

        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={handleFilterByDate}>Filter</button>
      </div>

      {/* Appointments Table */}
      <table className="appointments-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Employee</th>
            <th>Service</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id}>
              <td>{appt.status}</td>
              <td>
                {appt.date} {appt.time}
              </td>
              <td>{appt.customer_name}</td>
              <td>{appt.employee_name}</td>
              <td>{appt.service_name}</td>
              <td>{appt.price} ₪</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Booking Form */}
      <div className="book-appointment">
        <h2>Book an Appointment for Customer</h2>
        <input
          type="email"
          name="customerEmail"
          placeholder="Customer Email"
          value={form.customerEmail}
          onChange={handleFormChange}
          onBlur={checkCustomerEmail}
        />
        {!emailExists && (
          <p style={{ color: "red" }}>
            You should{" "}
            <button
              type="button"
              onClick={() => setShowSignUpModal(true)}
              className="link-btn"
              style={{
                background: "none",
                border: "none",
                color: "blue",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              sign up
            </button>{" "}
            first.
          </p>
        )}

        {/* Select Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Select Service */}
        <select
          name="serviceId"
          value={form.serviceId}
          onChange={handleFormChange}
          disabled={!selectedCategory}
        >
          <option value="">Select Service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} – ₪{service.price}
            </option>
          ))}
        </select>

        {/* Select Employee */}
        <select
          name="employeeId"
          value={form.employeeId}
          onChange={handleFormChange}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleFormChange}
        />
        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleFormChange}
        />
        <button onClick={handleCreateAppointment} disabled={!emailExists}>
          Book
        </button>
      </div>

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <SignUpModal
          onClose={() => setShowSignUpModal(false)}
          onSuccess={checkCustomerEmail}
        />
      )}
    </div>
  );
}

export default Appointments;

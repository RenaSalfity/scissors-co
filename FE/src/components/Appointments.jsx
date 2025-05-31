import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../assets/styles/Appointments.css";
import SignUpModal from "./SignUpModal";

function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredTimes, setFilteredTimes] = useState([]);
  const [emailExists, setEmailExists] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const [form, setForm] = useState({
    customerEmail: "",
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
  });

  const today = new Date();
  const toLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
  };

  const defaultStartDate = toLocalDateString(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const defaultEndDate = toLocalDateString(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );

  useEffect(() => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    fetchAppointments(defaultStartDate, defaultEndDate);
    fetchCategories();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [form.employeeId]);

  useEffect(() => {
    fetchAppointments();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedCategory) fetchServicesByCategory(selectedCategory);
    else setServices([]);
  }, [selectedCategory]);

  const fetchAppointments = (start = startDate, end = endDate) => {
    const employeeParam =
      user.role === "Employee"
        ? `&employeeId=${user.id}`
        : form.employeeId
        ? `&employeeId=${form.employeeId}`
        : "";

    const dateFilter =
      start && end
        ? `?start=${start}&end=${end}${employeeParam}`
        : employeeParam
        ? `?${employeeParam.substring(1)}`
        : "";

    axios
      .get(`http://localhost:5001/api/appointments${dateFilter}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error("Failed to fetch appointments:", err));
  };

  const handleResetFilters = () => {
    setForm((prev) => ({ ...prev, employeeId: "" }));
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    fetchAppointments(defaultStartDate, defaultEndDate);
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();

    if (appointments.length === 0) {
      doc.text("No appointments found in this period.", 14, 16);
      doc.save("appointments_report.pdf");
      return; // Exit early if no appointments found
    }

    doc.text("Appointments Report", 14, 16);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 24);

    const vatMap = {};
    const uniqueDates = [...new Set(appointments.map((a) => a.date))];

    for (const date of uniqueDates) {
      try {
        const res = await axios.get(`http://localhost:5001/api/vat/by-date`, {
          params: { date },
        });
        vatMap[date] = parseFloat(res.data.percentage || "0");
      } catch {
        vatMap[date] = 0;
      }
    }

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Status",
          "Date",
          "Time",
          "Customer",
          ...(user.role === "Admin" ? ["Employee"] : []),
          "Service",
          "Price (ils)",
        ],
      ],
      body: appointments.map((appt) => [
        appt.status,
        appt.date,
        appt.time,
        appt.customer_name,
        ...(user.role === "Admin" ? [appt.employee_name] : []),
        appt.service_name,
        `${appt.price} ils`,
      ]),
    });

    const totalVATs = appointments.map((appt) => {
      const vat = vatMap[appt.date] || 0;
      const price = parseFloat(appt.price || 0);
      const beforeVAT = price / (1 + vat / 100);
      return { price, vat, beforeVAT };
    });

    const revenueSum = totalVATs.reduce((sum, r) => sum + r.price, 0);
    const totalBeforeVAT = totalVATs.reduce((sum, r) => sum + r.beforeVAT, 0);
    const vatAmount = revenueSum - totalBeforeVAT;

    const lastY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Before VAT: ${totalBeforeVAT.toFixed(2)} ils`, 14, lastY);
    doc.text(`VAT Amount: ${vatAmount.toFixed(2)} ils`, 14, lastY + 10);
    doc.text(`Total Revenue: ${revenueSum.toFixed(2)} ils`, 14, lastY + 20);

    doc.save("appointments_report.pdf");
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

  const fetchAvailableEmployees = (date) => {
    axios
      .get("http://localhost:5001/api/employees/available", {
        params: { date },
      })
      .then((res) => {
        const filtered = res.data.filter((emp) => emp.id !== user.id);
        setEmployees(filtered);
      })
      .catch(() => setEmployees([]));
  };

  const fetchAvailableTimes = (serviceId, employeeId, rawDate) => {
    const normalizedDate = new Date(rawDate).toISOString().split("T")[0];
    axios
      .get("http://localhost:5001/api/available-times", {
        params: { serviceId, employeeId, date: normalizedDate },
      })
      .then((res) => setFilteredTimes(res.data))
      .catch(() => setFilteredTimes([]));
  };

  const checkCustomerEmail = () => {
    const email = form.customerEmail.trim();
    if (!email) return;
    axios
      .get(`http://localhost:5001/api/users/check-email?email=${email}`)
      .then((res) => setEmailExists(res.data.exists))
      .catch(() => setEmailExists(true));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    if (name === "date" && value) fetchAvailableEmployees(value);
    if (
      (name === "employeeId" && updatedForm.serviceId && updatedForm.date) ||
      (name === "serviceId" && updatedForm.employeeId && updatedForm.date)
    ) {
      fetchAvailableTimes(
        updatedForm.serviceId,
        updatedForm.employeeId,
        updatedForm.date
      );
    }
    setForm(updatedForm);
  };

  const handleCreateAppointment = () => {
    const payload = {
      customerEmail: form.customerEmail.trim(),
      serviceId: form.serviceId,
      employeeId: form.employeeId,
      date: form.date,
      time: form.time,
    };

    if (Object.values(payload).some((v) => !v)) {
      alert("Please fill in all fields.");
      return;
    }

    axios
      .post("http://localhost:5001/api/appointments", payload)
      .then(() => {
        alert("Appointment booked successfully!");
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
        setFilteredTimes([]);
        setEmailExists(true);
      })
      .catch(() => alert("Booking failed."));
  };

  const totalRevenue = appointments.reduce((sum, appt) => {
    const price = parseFloat(appt.price);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  return (
    <div className="appointments-screen">
      <h1>Manage Appointments</h1>
      <p className="date-range-label">
        📅 Showing appointments from {startDate} to {endDate}
      </p>

      {/* Filters */}
      <div className="filters">
        {user.role === "Admin" && (
          <>
            <label>Filter by Employee:</label>
            <select
              value={form.employeeId}
              name="employeeId"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employeeId: e.target.value }))
              }
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </>
        )}

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
        <button onClick={handleResetFilters}>Reset</button>
        <button onClick={handleExportPDF}>
          Export to PDF
        </button>
      </div>

      {/* Appointments Table */}
      <table className="appointments-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Date & Time</th>
            <th>Customer</th>
            {user.role === "Admin" && <th>Employee</th>}
            <th>Service</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {[...appointments]
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`) -
                new Date(`${b.date}T${b.time}`)
            )
            .map((appt) => (
              <tr key={appt.id}>
                <td>{appt.status}</td>
                <td>
                  {appt.date} {appt.time}
                </td>
                <td>{appt.customer_name}</td>
                {user.role === "Admin" && <td>{appt.employee_name}</td>}
                <td>{appt.service_name}</td>
                <td>{appt.price} ₪</td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={user.role === "Admin" ? 5 : 4}
              style={{ textAlign: "right", fontWeight: "bold" }}
            >
              Total:
            </td>
            <td style={{ fontWeight: "bold" }}>₪{totalRevenue.toFixed(2)}</td>
          </tr>
        </tfoot>
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
            <button type="button" onClick={() => setShowSignUpModal(true)}>
              sign up
            </button>{" "}
            first.
          </p>
        )}

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

        <select
          name="serviceId"
          value={form.serviceId}
          onChange={handleFormChange}
          disabled={!selectedCategory}
        >
          <option value="">Select Service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} – ₪{s.price}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleFormChange}
          min={new Date().toISOString().split("T")[0]}
        />

        <select
          name="employeeId"
          value={form.employeeId}
          onChange={handleFormChange}
        >
          <option value="">Choose Employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <select name="time" value={form.time} onChange={handleFormChange}>
          <option value="">Choose Time</option>
          {filteredTimes.map((time, i) => (
            <option key={i} value={time}>
              {time}
            </option>
          ))}
        </select>

        <button onClick={handleCreateAppointment} disabled={!emailExists}>
          Book
        </button>
      </div>

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

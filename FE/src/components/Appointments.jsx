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
  const [editedStatuses, setEditedStatuses] = useState({});
  const [exportStatus, setExportStatus] = useState("all");
  const [allowedEmployeeIds, setAllowedEmployeeIds] = useState([]);
  const [closedDays, setClosedDays] = useState([]);
  const [specialOverride, setSpecialOverride] = useState({});


  const [filter, setFilter] = useState({
    employeeId: "",
  });

  const [bookingForm, setBookingForm] = useState({
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

    axios
      .get("http://localhost:5001/api/business-hours/closed-days")
      .then((res) => {
        setClosedDays(res.data.closedDays || []);
        setSpecialOverride(res.data.specialOverride || {});
      })
      .catch((err) => console.error("❌ Failed to fetch closed days", err));
  }, []);

  // ✅ this is a separate useEffect (NOT nested!)
  useEffect(() => {
    fetchAppointments(startDate, endDate);
  }, [filter.employeeId, startDate, endDate]);

  useEffect(() => {
    if (selectedCategory) fetchServicesByCategory(selectedCategory);
    else setServices([]);
  }, [selectedCategory]);

  useEffect(() => {
    if (filter.date && allowedEmployeeIds.length > 0) {
      fetchAvailableEmployees(filter.date);
    }
  }, [allowedEmployeeIds, filter.date]);
  

  const fetchAppointments = (start = startDate, end = endDate) => {
    let query = `?start=${start}&end=${end}`;

    if (user.role === "Employee") {
      query += `&employeeId=${user.id}`;
    } else if (user.role === "Customer") {
      query += `&customerId=${user.id}`;
    } else if (filter.employeeId) {
      query += `&employeeId=${filter.employeeId}`;
    }

    axios
      .get(`http://localhost:5001/api/appointments${query}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error("Failed to fetch appointments:", err));
  };

  const fetchCategories = () => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories:", err));
  };

  const fetchEmployees = () => {
    axios
      .get("http://localhost:5001/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Failed to load employees:", err));
  };

  const fetchServicesByCategory = (categoryId) => {
    axios
      .get(`http://localhost:5001/services/${categoryId}`)
      .then((res) => setServices(res.data))
      .catch((err) => console.error("Failed to load services:", err));
  };

  const fetchAvailableEmployees = (date) => {
    axios
      .get("http://localhost:5001/api/employees/available", {
        params: { date },
      })
      .then((res) => {
        const customerEmail = bookingForm.customerEmail.trim().toLowerCase();
        const loggedInEmail = user.email.toLowerCase();

        const filtered = res.data.filter((emp) => {
          // 🧠 Block self only if booking yourself
          const isSelf = emp.id === user.id;
          const isBookingSelf = customerEmail === loggedInEmail;
          if (isSelf && isBookingSelf) return false;

          // 🧠 Respect allowed employees
          if (
            allowedEmployeeIds.length > 0 &&
            !allowedEmployeeIds.includes(emp.id)
          ) {
            return false;
          }

          return true;
        });

        setEmployees(filtered);
      })
      .catch((err) => {
        console.error("❌ Error loading available employees:", err);
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
      .catch(() => setFilteredTimes([]));
  };

  const checkCustomerEmail = () => {
    const email = bookingForm.customerEmail.trim();

    if (!email) return;
    axios
      .get(`http://localhost:5001/api/users/check-email?email=${email}`)
      .then((res) => setEmailExists(res.data.exists))
      .catch(() => setEmailExists(true));
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    setEditedStatuses((prev) => ({
      ...prev,
      [appointmentId]: newStatus,
    }));
  };

  const handleSaveAllStatuses = async () => {
    const updates = Object.entries(editedStatuses);
    try {
      await Promise.all(
        updates.map(([id, status]) =>
          axios.put(`http://localhost:5001/api/appointments/${id}/status`, {
            status,
          })
        )
      );
      setAppointments((prev) =>
        prev.map((appt) =>
          editedStatuses[appt.id]
            ? { ...appt, status: editedStatuses[appt.id] }
            : appt
        )
      );
      setEditedStatuses({});
      alert("Statuses updated successfully.");
    } catch (err) {
      console.error("Failed to update statuses", err);
      alert("Failed to update statuses.");
    }
  };

  const handleResetFilters = () => {
    setFilter({ employeeId: "" });
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setExportStatus("all");
    fetchAppointments(defaultStartDate, defaultEndDate);
  };

  const handleExportPDF = async (statusFilter = "all") => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    const filteredAppts = appointments
      .filter((appt) => statusFilter === "all" || appt.status === statusFilter)
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
      );

    if (filteredAppts.length === 0) {
      doc.text("No appointments found in this period.", 14, 16);
      doc.save("appointments_report.pdf");
      return;
    }

    doc.text("Appointments Report", 14, 16);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 24);

    const vatMap = {};
    const uniqueDates = [...new Set(filteredAppts.map((a) => a.date))];

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
          "Customer",
          "Date & Time",
          "Status",
          "Employee",
          "Service",
          "Price (ILS)",
        ],
      ],
      body: filteredAppts.map((appt) => [
        appt.customer_name,
        `${new Date(appt.date).toLocaleDateString("en-GB")} ${appt.time?.slice(
          0,
          5
        )}`,
        appt.status,
        appt.employee_name,
        appt.service_name,
        `${appt.price} ILS`,
      ]),
      styles: { cellPadding: 2, fontSize: 9 },
      columnStyles: {
        1: { cellWidth: 32 },
        2: { cellWidth: 28 },
        4: { cellWidth: 40 },
      },
    });

    const totalVATs = filteredAppts
      .filter((appt) => appt.status === "done")
      .map((appt) => {
        const vat = vatMap[appt.date] || 0;
        const price = parseFloat(appt.price || 0);
        const beforeVAT = price / (1 + vat / 100);
        return { price, vat, beforeVAT };
      });

    const revenueSum = totalVATs.reduce((sum, r) => sum + r.price, 0);
    const totalBeforeVAT = totalVATs.reduce((sum, r) => sum + r.beforeVAT, 0);
    const vatAmount = revenueSum - totalBeforeVAT;

    const lastY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Before VAT: ${totalBeforeVAT.toFixed(2)} ILS`, 14, lastY);
    doc.text(`VAT Amount: ${vatAmount.toFixed(2)} ILS`, 14, lastY + 10);
    doc.text(`Total Revenue: ${revenueSum.toFixed(2)} ILS`, 14, lastY + 20);

    doc.save("appointments_report.pdf");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...filter, [name]: value };

    if (name === "serviceId") {
      fetchAllowedEmployees(value); // 🔥 FIX: call it here
      setFilteredTimes([]);
      setEmployees([]); // clear employees so they re-fetch on next date
    }

    if (name === "date" && value) {
      const testDate = new Date(value);
      if (!isDateAllowed(testDate)) {
        alert("Business is closed on this day.");
        return;
      }
      fetchAvailableEmployees(value);
    }

    if (
      (name === "employeeId" && updatedForm.serviceId && updatedForm.date) ||
      (name === "serviceId" && updatedForm.employeeId && updatedForm.date)
    ) {
      const testDate = new Date(updatedForm.date);
      if (!isDateAllowed(testDate)) return;

      fetchAvailableTimes(
        updatedForm.serviceId,
        updatedForm.employeeId,
        updatedForm.date
      );
    }

    setFilter(updatedForm);
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

  const handleCreateAppointment = () => {
    const payload = {
      customerEmail: bookingForm.customerEmail.trim(),
      serviceId: bookingForm.serviceId,
      employeeId: bookingForm.employeeId,
      date: bookingForm.date,
      time: bookingForm.time,
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
        setBookingForm({
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
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...bookingForm, [name]: value };

    if (name === "serviceId") {
      fetchAllowedEmployees(value);
      setFilteredTimes([]);
      setEmployees([]);
    }

    if (name === "date" && value) {
      const testDate = new Date(value);
      if (!isDateAllowed(testDate)) {
        alert("Business is closed on this day.");
        return;
      }
      fetchAvailableEmployees(value);
    }

    if (
      (name === "employeeId" && updated.serviceId && updated.date) ||
      (name === "serviceId" && updated.employeeId && updated.date)
    ) {
      const testDate = new Date(updated.date);
      if (!isDateAllowed(testDate)) return;

      fetchAvailableTimes(updated.serviceId, updated.employeeId, updated.date);
    }

    setBookingForm(updated);
  };

  const totalRevenue = appointments.reduce((sum, appt) => {
    if (appt.status !== "done") return sum;
    const price = parseFloat(appt.price);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const statusCounts = appointments.reduce((acc, appt) => {
    const status = appt.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const isDateAllowed = (input) => {
    const dateObj = new Date(input);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    const dateStr = dateObj.toISOString().split("T")[0];

    if (specialOverride[dateStr]) {
      const special = specialOverride[dateStr];
      if (
        special.start_time === "00:00:00" &&
        special.end_time === "00:00:00"
      ) {
        return false;
      }
      return true;
    }

    const weekday = dateObj.toLocaleString("en-US", { weekday: "long" });
    return !closedDays.includes(weekday);
  };
  

  return (
    <div className="appointments-screen">
      <h1>Manage Appointments</h1>

      <p className="date-range-label">
        📅 Showing appointments from {startDate} to {endDate}
      </p>
      <div className="status-summary">
        🟡 Pending: {statusCounts["pending"] || 0} &nbsp;&nbsp; ✅ Done:{" "}
        {statusCounts["done"] || 0} &nbsp;&nbsp; ❌ Cancelled:{" "}
        {(statusCounts["cancelled by customer"] || 0) +
          (statusCounts["cancelled by business"] || 0)}{" "}
        &nbsp;&nbsp; ⛔ No Show: {statusCounts["no show"] || 0}
      </div>

      <div className="filters">
        {user.role === "Admin" && (
          <>
            <label>Filter by Employee:</label>
            <select
              value={filter.employeeId}
              name="employeeId"
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, employeeId: e.target.value }))
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
        <label>Status to Export:</label>
        <select
          value={exportStatus}
          onChange={(e) => setExportStatus(e.target.value)}
          style={{ minWidth: "180px" }}
        >
          <option value="all">All</option>
          <option value="done">Done</option>
          <option value="pending">Pending</option>
          <option value="no show">No Show</option>
          <option value="cancelled by customer">Cancelled by Customer</option>
          <option value="cancelled by business">Cancelled by Business</option>
        </select>

        <button onClick={() => handleExportPDF(exportStatus)}>Export</button>

        <button onClick={handleResetFilters}>Reset</button>

        {(user.role === "Admin" || user.role === "Employee") &&
          Object.keys(editedStatuses).length > 0 && (
            <button onClick={handleSaveAllStatuses}>Save All Changes</button>
          )}
      </div>

      <table className="appointments-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Employee</th>
            <th>Service</th>
            <th>Price</th>
          </tr>
        </thead>

        <tbody>
          {appointments
            .filter(
              (appt) => exportStatus === "all" || appt.status === exportStatus
            )
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`) -
                new Date(`${b.date}T${b.time}`)
            )
            .map((appt) => (
              <tr key={appt.id}>
                <td>{appt.customer_name}</td>
                <td>
                  {new Date(appt.date).toLocaleDateString("en-GB")}{" "}
                  {appt.time.slice(0, 5)}
                </td>
                <td className="status">
                  {user.role === "Admin" || user.role === "Employee" ? (
                    <select
                      value={editedStatuses[appt.id] ?? appt.status}
                      onChange={(e) =>
                        handleStatusChange(appt.id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                      <option value="no show">No Show</option>
                      <option value="cancelled by customer">
                        Cancelled by Customer
                      </option>
                      <option value="cancelled by business">
                        Cancelled by Business
                      </option>
                    </select>
                  ) : (
                    <span>{appt.status}</span>
                  )}
                </td>
                <td>{appt.employee_name}</td>
                <td>{appt.service_name}</td>
                <td>{appt.price} ₪</td>
              </tr>
            ))}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: "right", fontWeight: "bold" }}>
              Total:
              <div
                style={{
                  fontWeight: "normal",
                  fontSize: "0.95rem",
                  color: "#666",
                }}
              >
                (Only appointments marked as "done" are included)
              </div>
            </td>
            <td style={{ fontWeight: "bold" }}>₪{totalRevenue.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Booking Form */}
      {user.role !== "Customer" && (
        <div className="book-appointment">
          <h2>Book an Appointment for Customer</h2>

          <input
            type="email"
            name="customerEmail"
            placeholder="Customer Email"
            value={bookingForm.customerEmail}
            onChange={handleBookingChange}
            onBlur={checkCustomerEmail}
          />

          {!emailExists && (
            <p style={{ color: "red" }}>
              You should sign up first!{" "}
              <button type="button" onClick={() => setShowSignUpModal(true)}>
                sign up
              </button>
            </p>
          )}
          <fieldset
            disabled={!emailExists}
            style={{ border: "none", padding: 0 }}
          >
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
              value={bookingForm.serviceId}
              onChange={handleBookingChange}
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
              value={bookingForm.date}
              onChange={handleBookingChange}
              min={new Date().toISOString().split("T")[0]}
              style={{
                backgroundColor:
                  bookingForm.date && !isDateAllowed(bookingForm.date)
                    ? "#ffd2d2"
                    : "",
              }}
              title={
                bookingForm.date && !isDateAllowed(bookingForm.date)
                  ? "Business is closed on this day"
                  : ""
              }
            />

            <select
              name="employeeId"
              value={bookingForm.employeeId}
              onChange={handleBookingChange}
            >
              <option value="">Choose Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <select
              name="time"
              value={bookingForm.time}
              onChange={handleBookingChange}
            >
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
          </fieldset>
        </div>
      )}

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

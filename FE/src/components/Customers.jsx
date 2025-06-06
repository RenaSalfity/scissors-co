import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const toLocalISOString = (date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  };

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(`${year}-06-01`);
    const end = new Date(year, 6, 0);

    const from = toLocalISOString(start);
    const to = toLocalISOString(end);

    setStartDate(from);
    setEndDate(to);

    setTimeout(() => fetchCustomers(from, to), 0);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchCustomers(startDate, endDate);
    }
  }, [startDate, endDate]);

  const fetchCustomers = (from, to) => {
    axios
      .get("http://localhost:5001/api/customers/summary-range", {
        params: { start: from, end: to },
      })
      .then((res) => {
        const processed = res.data.map((c) => {
          const appts = c.appointments || [];

          const totalAppointments = appts.length;

          const totalSpent = appts.reduce((sum, a) => {
            return a.status === "done" ? sum + (parseFloat(a.price) || 0) : sum;
          }, 0);

          const countMap = {};
          appts.forEach((a) => {
            if (a.status === "done" && a.service) {
              countMap[a.service] = (countMap[a.service] || 0) + 1;
            }
          });

          const fav = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0];

          return {
            ...c,
            appointments: appts,
            totalAppointments,
            totalSpent,
            favoriteService: fav ? fav[0] : "-",
          };
        });

        // Sort by highest spender
        const sorted = processed.sort((a, b) => b.totalSpent - a.totalSpent);
        setCustomers(sorted);
        setFiltered(sorted);
      })
      .catch((err) =>
        console.error("❌ Failed to load customer summary:", err)
      );
  };

  const exportToPDF = () => {
    alert("PDF export not implemented yet.");
  };

  const openModal = (customer) => {
    setSelectedAppointments(customer.appointments);
    setSelectedCustomer(customer.name);
    setShowModal(true);
  };

  return (
    <div className="customers-container">
      <h2>Customers Summary</h2>
      <p className="date-range-label">
        📅 Showing from {startDate} to {endDate}
      </p>

      <div className="filter-bar">
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
        <button onClick={exportToPDF}>Export to PDF</button>
      </div>

      <table className="customers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Total Appointments</th>
            <th>Favorite Service</th>
            <th>Total Spent (₪)</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>
                <button
                  className="link-btn"
                  onClick={() => openModal(c)}
                  title="Click to view appointments"
                >
                  {c.totalAppointments}
                </button>
              </td>
              <td>{c.favoriteService}</td>
              <td>₪{c.totalSpent.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div
          className="customer-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedCustomer}'s Appointments</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedAppointments.map((a, idx) => (
                  <tr key={idx}>
                    <td>{new Date(a.date).toLocaleDateString("he-IL")}</td>
                    <td>{a.time?.slice(0, 5)}</td>
                    <td>{a.service}</td>
                    <td>
                      ₪{a.price ? parseFloat(a.price).toFixed(2) : "0.00"}
                    </td>
                    <td>{a.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowModal(false)} className="save-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;

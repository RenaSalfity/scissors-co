import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const toLocalISOString = (date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  };

  // Set default start and end date to full June
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const juneStart = new Date(`${year}-06-01`);
    const juneEnd = new Date(year, 6, 0); // June = month 5, so 6 gives last day

    const startStr = toLocalISOString(juneStart);
    const endStr = toLocalISOString(juneEnd);
    setStartDate(startStr);
    setEndDate(endStr);

    setTimeout(() => fetchCustomers(startStr, endStr), 0);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchCustomers(startDate, endDate);
    }
  }, [startDate, endDate]);

  const fetchCustomers = (from, to) => {
    axios
      .get("http://localhost:5001/api/customers/details")
      .then((res) => {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59);

        const processed = res.data.map((c) => {
          const appts = (c.appointments || []).filter((a) => {
            const d = new Date(a.date);
            const status = (a.status || "").trim().toLowerCase();
            return d >= fromDate && d <= toDate && status === "done";
          });

          const totalAppointments = appts.length;

          const totalSpent = appts.reduce((sum, a) => {
            const price = parseFloat(a.price);
            return sum + (isNaN(price) ? 0 : price);
          }, 0);

          const serviceCount = {};
          appts.forEach((a) => {
            if (a.service) {
              serviceCount[a.service] = (serviceCount[a.service] || 0) + 1;
            }
          });

          const fav = Object.entries(serviceCount).sort(
            (a, b) => b[1] - a[1]
          )[0];

          return {
            ...c,
            totalAppointments,
            totalSpent,
            favoriteService: fav ? fav[0] : "-",
          };
        });

        setCustomers(processed);
        setFiltered(processed);
      })
      .catch((err) => console.error("Failed to load customer summary:", err));
  };

  const exportToPDF = () => {
    alert("PDF export not implemented yet.");
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
              <td>{c.totalAppointments}</td>
              <td>{c.favoriteService}</td>
              <td>₪{c.totalSpent.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;

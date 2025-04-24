import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [range, setRange] = useState("all");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    axios
      // .get("http://localhost:5001/api/customers/summary")

      .get("http://localhost:5001/api/customers/details")

      .then((res) => {
        setCustomers(res.data);
        setFiltered(res.data);
      })
      .catch((err) => console.error("Failed to load customer summary:", err));
  };

  const handleFilter = (value) => {
    setRange(value);
    if (value === "all") {
      setFiltered(customers);
    } else {
      const now = new Date();
      const from = new Date();
      if (value === "week") from.setDate(now.getDate() - 7);
      else if (value === "month") from.setMonth(now.getMonth() - 1);
      else if (value === "year") from.setFullYear(now.getFullYear() - 1);

      const filteredData = customers.map((c) => {
        const filteredAppts = c.appointments.filter((a) => {
          const d = new Date(a.date);
          return d >= from && d <= now;
        });

        const totalSpent = filteredAppts.reduce((sum, a) => sum + a.price, 0);
        const favoriteService = filteredAppts.reduce((acc, curr) => {
          acc[curr.service] = (acc[curr.service] || 0) + 1;
          return acc;
        }, {});
        const fav = Object.entries(favoriteService).sort(
          (a, b) => b[1] - a[1]
        )[0];

        return {
          ...c,
          totalSpent,
          favoriteService: fav ? fav[0] : "-",
          totalAppointments: filteredAppts.length,
        };
      });

      setFiltered(filteredData);
    }
  };

  const exportToPDF = () => {
    alert("PDF export not implemented in this version.");
  };

  return (
    <div className="customers-container">
      <h2>Customers</h2>

      <div className="filter-bar">
        <label>Filter: </label>
        <select value={range} onChange={(e) => handleFilter(e.target.value)}>
          <option value="all">All Time</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="year">Past Year</option>
        </select>

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
              <td>{c.totalAppointments || c.appointments?.length || 0}</td>
              <td>{c.favoriteService || "-"}</td>
              <td>
                {c.totalSpent != null
                  ? c.totalSpent
                  : c.appointments?.reduce((sum, a) => sum + a.price, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;

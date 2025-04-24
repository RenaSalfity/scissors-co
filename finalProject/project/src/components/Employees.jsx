import React, { useEffect, useState } from "react";
import axios from "axios";
import SignUpModal from "./SignUpModal";
import "../assets/styles/Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchCustomers();
  }, []);

  const fetchEmployees = () => {
    axios
      .get("http://localhost:5001/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Failed to load employees:", err));
  };

  const fetchCustomers = () => {
    axios
      .get("http://localhost:5001/api/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Failed to load customers:", err));
  };

  const toggleEmployeeStatus = async (id) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to remove this employee?"
      );
      if (!confirmed) return;

      const res = await axios.get(
        `http://localhost:5001/api/employees/${id}/appointments`
      );
      const hasAppointments = res.data.hasAppointments;

      if (hasAppointments) {
        alert("This employee still has appointments and cannot be removed.");
        return;
      }

      // ✅ Demote the employee
      await axios.put(`http://localhost:5001/api/users/${id}/role`, {
        role: "Customer",
      });

      setMessage("Employee demoted to Customer.");

      // ✅ Manually update the UI
      const updatedEmp = employees.find((emp) => emp.id === id);
      if (updatedEmp) {
        updatedEmp.role = "Customer";
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setCustomers((prev) => [...prev, updatedEmp]);
      }
    } catch (err) {
      console.error("Failed to process demotion:", err);
    }
  };

  const promoteCustomer = (id) => {
    axios
      .put(`http://localhost:5001/api/users/${id}/role`, { role: "Employee" })
      .then(() => {
        fetchEmployees();
        fetchCustomers();
        setMessage("User promoted to Employee.");
      })
      .catch((err) => console.error("Promotion failed:", err));
  };

  return (
    <div className="employees-page">
      <h2>Employees</h2>
      <button onClick={() => setShowModal(true)} className="add-btn">
        + Add Employee
      </button>
      {message && <p className="message">{message}</p>}

      {/* Employees Table */}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.phone}</td>
              <td>
                <button
                  onClick={() => toggleEmployeeStatus(emp.id)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Promote Existing Customers */}
      <h3>Promote Customer to Employee</h3>
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Promote</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((cust) => (
            <tr key={cust.id}>
              <td>{cust.name}</td>
              <td>{cust.email}</td>
              <td>
                <button onClick={() => promoteCustomer(cust.id)}>
                  Promote
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <SignUpModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchEmployees();
            setShowModal(false);
          }}
          forceRole="Employee"
        />
      )}
    </div>
  );
}

export default Employees;

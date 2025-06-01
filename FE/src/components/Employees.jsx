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

  const toggleEmployeeStatus = async (id, newRole) => {
    try {
      if (newRole === "Customer") {
        const res = await axios.get(
          `http://localhost:5001/api/employees/${id}/appointments`
        );
        const { total, appointments } = res.data;

        if (total > 0) {
          const confirmed = window.confirm(
            `This employee has ${total} upcoming appointment(s).\n` +
              `If you deactivate them, all will be marked as 'cancelled by business'.\n` +
              `Do you want to continue?`
          );

          if (!confirmed) return;

          await axios.put(
            `http://localhost:5001/api/appointments/cancel-by-business`,
            {
              employeeId: id,
              appointments,
            }
          );

          setMessage("Employee deactivated and appointments cancelled.");
        } else {
          setMessage("Employee had no appointments and was deactivated.");
        }

        await axios.put(`http://localhost:5001/api/users/${id}/role`, {
          role: "Customer",
          was_employee: 1,
        });
      } else {
        await axios.put(`http://localhost:5001/api/users/${id}/role`, {
          role: "Employee",
          was_employee: 0,
        });
        setMessage("Employee reactivated.");
      }

      fetchEmployees();
      fetchCustomers();
    } catch (err) {
      console.error("Failed to toggle employee status:", err);
    }
  };

  const promoteCustomer = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/users/${id}/role`, {
        role: "Employee",
      });
      setMessage("User promoted to Employee.");
      fetchEmployees();
      fetchCustomers();
    } catch (err) {
      console.error("Promotion failed:", err);
    }
  };

  return (
    <div className="employees-page">
      <h2>Employees</h2>
      <button onClick={() => setShowModal(true)} className="add-btn">
        + Add Employee
      </button>
      {message && <p className="message">{message}</p>}

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.phone}</td>
              <td>
                <div className="status-buttons">
                  <button
                    className={`status-btn ${
                      emp.role === "Employee" ? "active-green" : "inactive-gray"
                    }`}
                    onClick={() => toggleEmployeeStatus(emp.id, "Employee")}
                    disabled={emp.role === "Employee"}
                  >
                    פעיל
                  </button>
                  <button
                    className={`status-btn ${
                      emp.role === "Customer" ? "inactive-red" : "inactive-gray"
                    }`}
                    onClick={() => toggleEmployeeStatus(emp.id, "Customer")}
                    disabled={emp.role === "Customer"}
                  >
                    לא פעיל
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

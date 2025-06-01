import React from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import "../assets/styles/Header.css";
import logo from "../assets/img/logo.png";

function Header({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    if (setUser) {
      setUser(null);
    }
    navigate("/login");
  };

  return (
    <header>
      <div className="header__wrap">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="logo" />
            <span>Scissors & Co.</span>
          </Link>
        </div>

        {user && location.pathname !== "/login" && (
          <nav>
            <ul className="menu">
              <li>
                <NavLink to="/">Home</NavLink>
              </li>

              {user.role === "Customer" && (
                <li>
                  <NavLink to="/about">About</NavLink>
                </li>
              )}

              {user.role === "Customer" && (
                <li>
                  <NavLink to="/customer/appointments">My Appointments</NavLink>
                </li>
              )}

              {user.role !== "Employee" && (
                <li>
                  <NavLink to="/contact">Contact</NavLink>
                </li>
              )}

              {user.role === "Admin" && (
                <>
                  <li>
                    <NavLink to="/admin/employees">Employees</NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/appointments">Appointments</NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/customers">Customers</NavLink>
                  </li>
                </>
              )}

              {user.role === "Employee" && (
                <li>
                  <NavLink to="/employee/services">Services</NavLink>
                </li>
              )}

              <li>
                <NavLink to="/settings">Settings</NavLink>
              </li>

              <li>
                <button className="logout-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;

import React from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import "../assets/styles/Header.css";
import logo from "../assets/img/logo.png";
//working well
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
        {/* ✅ Only show navigation links if not on login page and user is logged in */}
        {user && location.pathname !== "/login" && (
          <nav>
            <ul className="menu">
              <li>
                <NavLink to="/">Home</NavLink>
              </li>
              <li>
                <NavLink to="/about">About</NavLink>
              </li>
              <li>
                <NavLink to="/contact">Contact</NavLink>
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

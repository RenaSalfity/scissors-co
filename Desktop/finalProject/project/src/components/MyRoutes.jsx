import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";
import Customer from "./Customer";
import Employee from "./Employee";
import About from "./About";
import Contact from "./Contact";
import Header from "./Header";
import SinglePost from "./SinglePost";
import Footer from "./Footer";
import EditCategory from "./EditCategory";
import Appointments from "./Appointments";
import Employees from "./Employees";
import BookingPage from "./BookingPage";
import Customers from "./Customers";
import Settings from "./Settings"; 

function MyRoutes() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <>
      <Header user={user} setUser={setUser} />
      <Routes>
        {!user ? (
          <Route path="*" element={<Login setUser={setUser} />} />
        ) : (
          <>
            {/* ✅ Public routes for all logged-in users */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<BookingPage user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />{" "}
            {/* ✅ NEW */}
            <Route path="/post/:id" element={<SinglePost user={user} />} />
            {/* ✅ Admin routes */}
            {user.role === "Admin" && (
              <>
                <Route path="/admin" element={<Admin />} />
                <Route
                  path="/admin/appointments"
                  element={<Appointments user={user} />}
                />
                <Route path="/admin/employees" element={<Employees />} />
                <Route path="/admin/customers" element={<Customers />} />
                <Route path="/edit-category/:id" element={<EditCategory />} />
              </>
            )}
            {/* ✅ Customer route */}
            {user.role === "Customer" && (
              <Route path="/customer" element={<Customer />} />
            )}
            {/* ✅ Employee routes */}
            {user.role === "Employee" && (
              <>
                <Route path="/employee" element={<Employee />} />
                <Route
                  path="/employee/appointments"
                  element={<Appointments user={user} />}
                />
              </>
            )}
            {/* ✅ Catch-all redirect to role homepage */}
            <Route
              path="*"
              element={<Navigate to={`/${user.role.toLowerCase()}`} />}
            />
          </>
        )}
      </Routes>
      <Footer />
    </>
  );
}

export default MyRoutes;

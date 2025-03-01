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
            <Route path="/about" element=
            {<About />} />
            <Route path="/contact" element={<Contact />} />

            {user.role === "Admin" && (
              <>
                <Route path="/admin" element={<Admin />} />
                <Route path="/edit-category/:id" element={<EditCategory />} />
                <Route path="/post/:id" element={<SinglePost user={user} />} />
              </>
            )}
            {user.role === "Customer" && (
              <Route path="/customer" element={<Customer />} />
            )}
            {user.role === "Employee" && (
              <Route path="/employee" element={<Employee />} />
            )}

            <Route path="/post/:id" element={<SinglePost />} />
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

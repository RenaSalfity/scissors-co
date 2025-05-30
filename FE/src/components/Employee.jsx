import React, { useEffect, useState } from "react";
import axios from "axios";
import CategoryCarousel from "./CategoryCarousel"; 
import "../assets/styles/MainPage.css";

function Employee() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  return (
    <div className="employee-container">
      <div className="main">
        <h1 className="main-page-title">Choose a Service</h1>
        <CategoryCarousel
          categories={categories}
          role="Employee"
          buttonLabel="Make an Appointment"
        />
      </div>
    </div>
  );
}

export default Employee;

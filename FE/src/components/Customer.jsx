import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";
import Footer from "./Footer";
import CategoryCarousel from "./CategoryCarousel";
import "../assets/styles/MainPage.css";

function Customer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  return (
    <div className="customer-container">
      <div className="main">
        <h1 className="main-page-title">Choose a Service</h1>
        <CategoryCarousel
          categories={categories}
          role="Customer"
          buttonLabel="Choose Service"
        />
      </div>
    </div>
  );
}

export default Customer;

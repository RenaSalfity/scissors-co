import React, { useEffect, useState } from "react";
import axios from "axios";
import CategoryCarousel from "./CategoryCarousel"; // ✅ Use the shared carousel
import "../assets/styles/MainPage.css";

function MainPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  return (
    <div className="main">
      <h1 className="main-page-title">שירותים</h1>
      <CategoryCarousel
        categories={categories}
        role="guest"
        buttonText="Choose Service"
      />
    </div>
  );
}

export default MainPage;

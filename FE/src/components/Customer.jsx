import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import "../assets/styles/MainPage.css";
import "../assets/styles/Articles.css";

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
      {/* <Header /> */}
      <div className="main">
        <section className="articles">
          <div className="container">
            <h1 className="main-page-title">Choose a Service</h1>
            <div className="articles-container">
              {categories.map((category) => (
                <div key={category.id} className="article-card">
                  <img
                    src={`http://localhost:5001/uploads/${category.image}`}
                    alt={category.name}
                    className="article-image"
                  />
                  <h2 className="article-title">{category.name}</h2>
                  <Link
                    to={`/post/${category.id}`}
                    state={{ post: category }}
                    className="view-button"
                  >
                    Choose Service
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      {/* <Footer /> */}
    </div>
  );
}

export default Customer;

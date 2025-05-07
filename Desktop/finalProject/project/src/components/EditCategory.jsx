import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../assets/styles/EditCategory.css";

function EditCategory() {
  const { id } = useParams(); // ✅ Get category ID from URL
  const navigate = useNavigate(); // ✅ Allows redirecting
  const [category, setCategory] = useState({});
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    fetchCategory();
  }, []);

  const fetchCategory = () => {
    axios
      .get(`http://localhost:5001/categories/${id}`)
      .then((res) => {
        setCategory(res.data);
        setNewName(res.data.name); // ✅ Prefill with existing name
      })
      .catch((err) => console.error("Error fetching category:", err));
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName);
    if (newImage) formData.append("image", newImage);

    axios
      .put(`http://localhost:5001/categories/${id}`, formData)
      .then(() => navigate("/admin")) // ✅ Redirect to Admin page
      .catch((err) => console.error("Error updating category:", err));
  };

  return (
    <div className="edit-category-container">
      {/* <Header /> */}
      <div className="main">
        <h1>Edit Category</h1>

        {/* ✅ Back to Main Button */}
        <button
          onClick={() => navigate("/admin")}
          className="back-button"
          style={{
            marginBottom: "15px",
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ← Back to Main Page
        </button>

        <form onSubmit={handleUpdateCategory}>
          <input
            type="text"
            placeholder="Category Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input type="file" onChange={(e) => setNewImage(e.target.files[0])} />
          <button type="submit">Save Changes</button>
        </form>
      </div>
      {/* <Footer /> */}
    </div>
  );

}

export default EditCategory;

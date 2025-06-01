import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../assets/styles/Admin.css";

function Admin() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", image: null });
  const [showForm, setShowForm] = useState(false);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    axios
      .get("http://localhost:5001/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      axios
        .delete(`http://localhost:5001/categories/${id}`)
        .then(() => fetchCategories())
        .catch((err) => console.error("Error deleting category:", err));
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newCategory.name);
    formData.append("image", newCategory.image);

    axios
      .post("http://localhost:5001/categories", formData)
      .then(() => {
        fetchCategories();
        setNewCategory({ name: "", image: null });
        setShowForm(false);
      })
      .catch((err) => console.error("Error adding category:", err));
  };

  const handleViewServices = (category) => {
    navigate(`/post/${category.id}`, { state: { post: category } });
  };

  const visibleCount = 3;
  const next = () => {
    setIndex((prev) => (prev + 1) % categories.length);
  };
  const prev = () => {
    setIndex((prev) =>
      prev === 0 ? categories.length - 1 : (prev - 1) % categories.length
    );
  };

  const getVisibleCategories = () => {
    if (categories.length <= visibleCount) return categories;
    const looped = [...categories, ...categories];
    return looped.slice(index, index + visibleCount);
  };

  return (
    <div className="admin-container">
      <div className="main">
        <button
          className="add-category-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close" : "Add Category"}
        </button>

        {showForm && (
          <form className="add-category-form" onSubmit={handleAddCategory}>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              required
            />
            <input
              type="file"
              onChange={(e) =>
                setNewCategory({ ...newCategory, image: e.target.files[0] })
              }
              required
            />
            <button type="submit">Save</button>
          </form>
        )}

        {!showForm && (
          <>
            <h2 className="admin-title">Manage Categories</h2>
            <div className="carousel-wrapper">
              <button className="carousel-arrow" onClick={prev}>
                ◀
              </button>

              <div className="carousel">
                {getVisibleCategories().map((category) => (
                  <div key={category.id} className="category-card">
                    {category.image ? (
                      <img
                        src={`http://localhost:5001/uploads/${category.image}`}
                        alt={category.name}
                      />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                    <h3>{category.name}</h3>
                    <div className="actions">
                      <Link to={`/edit-category/${category.id}`}>Edit</Link>
                      <button onClick={() => handleDeleteCategory(category.id)}>
                        Delete
                      </button>
                      <button onClick={() => handleViewServices(category)}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="carousel-arrow" onClick={next}>
                ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;

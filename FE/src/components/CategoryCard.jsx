import React from "react";
import { useNavigate } from "react-router-dom";

const CategoryCard = ({ category, onDelete }) => {
  const navigate = useNavigate(); // ✅ Enables programmatic navigation

  return (
    <div className="category-card">
      <img
        src={`http://localhost:5001/uploads/${category.image}`}
        alt={category.name}
      />
      <h3>{category.name}</h3>
      <div className="actions">
        <button onClick={() => navigate(`/edit-category/${category.id}`)}>
          Edit
        </button>{" "}
        <button onClick={() => onDelete(category.id)}>Delete</button>
      </div>
    </div>
  );
};

export default CategoryCard;

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/styles/Admin.css"; // Reuse existing styles

function CategoryCarousel({
  categories,
  onDelete,
  role = "Customer",
  buttonLabel = "Choose Service",
}) {
  const [index, setIndex] = React.useState(0);
  const navigate = useNavigate();

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
              {role === "Admin" ? (
                <>
                  <Link to={`/edit-category/${category.id}`}>Edit</Link>
                  <button onClick={() => onDelete(category.id)}>Delete</button>
                  <button
                    onClick={() =>
                      navigate(`/post/${category.id}`, {
                        state: { post: category },
                      })
                    }
                  >
                    View
                  </button>
                </>
              ) : (
                <Link
                  to={`/post/${category.id}`}
                  state={{ post: category }}
                  className="view-button"
                >
                  {buttonLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-arrow" onClick={next}>
        ▶
      </button>
    </div>
  );
}

export default CategoryCarousel;

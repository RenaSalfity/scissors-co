import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import "../assets/styles/EditPost.css";

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editedPost, setEditedPost] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  // Fetch post data for editing
  const fetchData = () => {
    axios
      .get(`/post/${id}`)
      .then((res) => {
        setEditedPost(res.data[0]); // Assuming the API returns an array
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching post data:", error);
        setError("Failed to fetch post data.");
        setLoading(false);
      });
  };

  const updatePost = (postToSend) => {
    axios
      .put(`/post/${id}`, postToSend)
      .then((res) => {
        console.log("Post updated:", res.data);
        setMsg("Post was updated successfully.");
        setTimeout(() => {
          setMsg("");
          navigate("/");
        }, 2000);
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("Failed to update the post.");
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedPost((prevPost) => ({
      ...prevPost,
      [name]: value,
    }));
  };

  const cleanString = (str) => str.trim().replace(/\s+/g, " ");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!editedPost) return;

    // Clean and validate fields
    const cleanedPost = {
      title: cleanString(editedPost.title),
      content: cleanString(editedPost.content),
      author: cleanString(editedPost.author),
    };

    if (!cleanedPost.title || !cleanedPost.content || !cleanedPost.author) {
      setError("All fields are required.");
      return;
    }

    if (cleanedPost.title.length < 3) {
      setError("Title must be at least 3 characters long.");
      return;
    }

    setError("");
    updatePost(cleanedPost);
  };

  if (loading) {
    return <div>Loading post data...</div>;
  }

  return (
    <div className="main">
      <h2>Edit Article</h2>
      {error && <p className="error-message">{error}</p>}
      {msg && <p className="success-message">{msg}</p>}
      {editedPost && (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={editedPost.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Content:</label>
            <textarea
              name="content"
              value={editedPost.content}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Author:</label>
            <input
              type="text"
              name="author"
              value={editedPost.author}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Save</button>
        </form>
      )}
    </div>
  );
}

export default EditPost;

import React, { useEffect, useState } from "react";
import axios from "axios";

function SubServiceList({ articleId }) {
  const [subServices, setSubServices] = useState([]);
  const [newSubService, setNewSubService] = useState({
    name: "",
    price: "",
    duration: "",
  });

  useEffect(() => {
    fetchSubServices();
  }, []);

  const fetchSubServices = () => {
    axios
      .get(`http://localhost:8801/subservices/${articleId}`)
      .then((res) => {
        console.log("✅ Sub-services Loaded:", res.data);
        setSubServices(res.data);
      })
      .catch((error) => {
        console.error("❌ Error fetching sub-services:", error);
      });
  };

  const handleChange = (e) => {
    setNewSubService({ ...newSubService, [e.target.name]: e.target.value });
  };

  const addSubService = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:8801/subservices", {
        ...newSubService,
        article_id: articleId,
      })
      .then(() => {
        fetchSubServices(); // Refresh list
        setNewSubService({ name: "", price: "", duration: "" });
      })
      .catch((error) => {
        console.error("❌ Error adding sub-service:", error);
      });
  };

  return (
    <div>
      <h2>Sub-Services</h2>

      {/* ✅ Form to add new sub-service */}
      <form onSubmit={addSubService}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={newSubService.name}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={newSubService.price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="duration"
          placeholder="Duration (min)"
          value={newSubService.duration}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Sub-Service</button>
      </form>

      {/* ✅ Displaying sub-services */}
      <ul>
        {subServices.map((subService) => (
          <li key={subService.id}>
            {subService.name} - ${subService.price} - {subService.duration} min
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SubServiceList;

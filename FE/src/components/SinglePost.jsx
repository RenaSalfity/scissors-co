import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/SinglePost.css";

function SinglePost({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    time: 15,
  });
  const [editService, setEditService] = useState(null);
  const [editSelectedEmployees, setEditSelectedEmployees] = useState([]);
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const [editSearch, setEditSearch] = useState("");

  const durationOptions = Array.from({ length: 8 }, (_, i) => (i + 1) * 15);

  useEffect(() => {
    axios
      .get(`http://localhost:5001/categories/${id}`)
      .then((res) => setCategory(res.data))
      .catch(() => setCategory(null));

    fetchServices();
    fetchEmployees();
  }, [id]);

  const fetchEmployees = () => {
    axios
      .get("http://localhost:5001/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Failed to load employees:", err));
  };

  const fetchServices = () => {
    axios
      .get(`http://localhost:5001/services/${id}`)
      .then((res) => setServices(res.data))
      .catch(() => setServices([]));
  };

  const fetchAssignedEmployees = async (serviceId) => {
    try {
      const res = await axios.get(
        `http://localhost:5001/api/service-employees/${serviceId}`
      );
      return res.data.employeeIds;
    } catch (err) {
      console.error("Error fetching assigned employees", err);
      return [];
    }
  };

  const toggleEmployeeSelection = (id, selectedList, setSelectedList) => {
    setSelectedList((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (Number(newService.price) <= 0)
      return alert("Price must be greater than 0");
    if (selectedEmployees.length === 0)
      return alert("Please select at least one employee");

    axios
      .post(`http://localhost:5001/services`, {
        ...newService,
        category_id: id,
        employee_ids: selectedEmployees,
      })
      .then(() => {
        setShowForm(false);
        setNewService({ name: "", price: "", time: 15 });
        setSelectedEmployees([]);
        fetchServices();
        alert("✅ Service added successfully.");
      })
      .catch((err) => console.error("Error adding service:", err));
  };

  const handleEditService = (e) => {
    e.preventDefault();
    if (Number(editService.price) <= 0)
      return alert("Price must be greater than 0");
    if (editSelectedEmployees.length === 0)
      return alert("Please select at least one employee");

    axios
      .put(`http://localhost:5001/services/${editService.id}`, {
        name: editService.name,
        price: editService.price,
        time: editService.time,
        employee_ids: editSelectedEmployees,
      })
      .then(() => {
        setEditService(null);
        setEditSelectedEmployees([]);
        fetchServices();
        alert("✅ Service updated successfully.");
      })
      .catch((err) => console.error("Error updating service:", err));
  };

  const handleDeleteService = (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;

    axios
      .delete(`http://localhost:5001/services/${serviceId}`)
      .then(() => fetchServices())
      .catch((err) =>
        console.error("Error deleting service:", err.response?.data || err)
      );
  };

  const handleBookClick = (service) => {
    navigate("/booking", { state: { service } });
  };

  const handleEditClick = async (service) => {
    setShowForm(false); // close add form if open
    const assigned = await fetchAssignedEmployees(service.id);
    setEditSelectedEmployees(assigned);
    setEditService(service);
  };

  const formatDuration = (min) => {
    if (min < 60) return `${min} minutes`;
    if (min === 60) return "1 hour";
    return `${Math.floor(min / 60)} hour${min % 60 ? ` ${min % 60}` : ""}`;
  };

  if (!category) return <h1>Service not found</h1>;

  return (
    <div className="single-post">
      <h1 className="post-title">{category.name}</h1>
      <button onClick={() => navigate("/")} className="back-button">
        ← Back to Main Page
      </button>

      {category.image && (
        <img
          src={`http://localhost:5001/uploads/${category.image}`}
          alt={category.name}
          className="post-image"
        />
      )}

      <h2 className="service-header">Available Services</h2>

      {services.length > 0 ? (
        <ul className="service-list">
          {services.map((service) => (
            <li key={service.id} className="service-item">
              <div>
                <h3>{service.name}</h3>
                <p>Price: ₪{service.price}</p>
                <p>Time: {formatDuration(service.time)}</p>
              </div>
              <button
                className="appointment-btn"
                onClick={() => handleBookClick(service)}
              >
                Make an appointment
              </button>
              {user?.role === "Admin" && (
                <>
                  <button
                    className="edit-btn"
                    onClick={() => handleEditClick(service)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-services">No services found for this category.</p>
      )}

      {user?.role === "Admin" && (
        <>
          {!editService && (
            <button
              className="add-service-btn"
              onClick={() => {
                setEditService(null); // close edit form
                setShowForm(!showForm); // toggle add form
              }}
            >
              {showForm ? "Close Form" : "Add Service"}
            </button>
          )}

          {showForm && (
            <form className="add-service-form" onSubmit={handleAddService}>
              <input
                type="text"
                placeholder="Service Name"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Price (₪)"
                min="1"
                value={newService.price}
                onChange={(e) =>
                  setNewService({ ...newService, price: e.target.value })
                }
                required
              />
              <select
                value={newService.time}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    time: parseInt(e.target.value),
                  })
                }
                required
              >
                {durationOptions.map((min) => (
                  <option key={min} value={min}>
                    {formatDuration(min)}
                  </option>
                ))}
              </select>

              <label>Select Employees</label>
              <div className="custom-multi-select">
                <div
                  className="multi-select-display"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedEmployees.length > 0
                    ? `${selectedEmployees.length} selected`
                    : "Select employees..."}
                </div>
                {dropdownOpen && (
                  <div className="multi-select-dropdown">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="multi-select-search"
                      onChange={(e) =>
                        setEmployeeSearch(e.target.value.toLowerCase())
                      }
                    />
                    <div className="multi-select-options">
                      {employees
                        .filter((e) =>
                          e.name.toLowerCase().includes(employeeSearch)
                        )
                        .map((e) => (
                          <label key={e.id}>
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(e.id)}
                              onChange={() =>
                                toggleEmployeeSelection(
                                  e.id,
                                  selectedEmployees,
                                  setSelectedEmployees
                                )
                              }
                            />
                            {e.name}
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit">Save Service</button>
            </form>
          )}

          {editService && (
            <form className="edit-service-form" onSubmit={handleEditService}>
              <h3>Edit Service</h3>
              <input
                type="text"
                value={editService.name}
                onChange={(e) =>
                  setEditService({ ...editService, name: e.target.value })
                }
                required
              />
              <input
                type="number"
                min="1"
                value={editService.price}
                onChange={(e) =>
                  setEditService({ ...editService, price: e.target.value })
                }
                required
              />
              <select
                value={editService.time}
                onChange={(e) =>
                  setEditService({
                    ...editService,
                    time: parseInt(e.target.value),
                  })
                }
                required
              >
                {durationOptions.map((min) => (
                  <option key={min} value={min}>
                    {formatDuration(min)}
                  </option>
                ))}
              </select>

              <label>Edit Assigned Employees</label>
              <div className="custom-multi-select">
                <div
                  className="multi-select-display"
                  onClick={() => setEditDropdownOpen(!editDropdownOpen)}
                >
                  {editSelectedEmployees.length > 0
                    ? `${editSelectedEmployees.length} selected`
                    : "Select employees..."}
                </div>
                {editDropdownOpen && (
                  <div className="multi-select-dropdown">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="multi-select-search"
                      onChange={(e) =>
                        setEditSearch(e.target.value.toLowerCase())
                      }
                    />
                    <div className="multi-select-options">
                      {employees
                        .filter((e) =>
                          e.name.toLowerCase().includes(editSearch)
                        )
                        .map((e) => (
                          <label key={e.id}>
                            <input
                              type="checkbox"
                              checked={editSelectedEmployees.includes(e.id)}
                              onChange={() =>
                                toggleEmployeeSelection(
                                  e.id,
                                  editSelectedEmployees,
                                  setEditSelectedEmployees
                                )
                              }
                            />
                            {e.name}
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="update-service-btn">
                Update Service
              </button>
              <button
                type="button"
                onClick={() => setEditService(null)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default SinglePost;

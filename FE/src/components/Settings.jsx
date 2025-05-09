import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Settings.css";

function Settings({ user }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    oldPassword: "",
    newPassword: "",
  });

  const [message, setMessage] = useState("");
  const [businessHours, setBusinessHours] = useState(
    Array(7).fill({ open: "08:00", close: "17:00" })
  );

  useEffect(() => {
    if (user?.email) {
      axios.get(`http://localhost:5001/users/${user.email}`).then((res) => {
        setForm((prev) => ({
          ...prev,
          name: res.data.name,
          phone: res.data.phone,
        }));
      });
    }
  }, [user?.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, oldPassword, newPassword } = form;

    if (!name.trim()) {
      setMessage("Name cannot be empty.");
      return;
    }

    if (newPassword && !/^(?=.*[a-zA-Z])(?=.*\d).{3,8}$/.test(newPassword)) {
      setMessage(
        "Password must be 3–8 characters and include at least one letter and one number."
      );
      return;
    }

    try {
      const payload = { name };
      if (newPassword) {
        if (!oldPassword) {
          setMessage("Please enter your current password.");
          return;
        }
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
      }

      await axios.put(
        `http://localhost:5001/api/users/${user.id}/profile`,
        payload
      );

      setMessage("Profile updated successfully.");
      setForm((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Update failed.");
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2>Settings</h2>

        <form onSubmit={handleSubmit} className="settings-form form-left">
          <label>Email (cannot change)</label>
          <input type="email" value={user.email} disabled />

          <label>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Phone</label>
          <input type="text" value={form.phone} disabled />

          <label>Old Password</label>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword || ""}
            onChange={handleChange}
          />

          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword || ""}
            onChange={handleChange}
          />

          <button type="submit" className="save-btn">
            Save Changes
          </button>

          {message && <p className="settings-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Settings;

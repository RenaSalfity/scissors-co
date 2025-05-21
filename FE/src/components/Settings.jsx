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
    Array(7).fill({ open: "09:00", close: "23:00" })
  );

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeOptions = [];
  for (let h = 9; h <= 23; h++) {
    timeOptions.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 23) timeOptions.push(`${h.toString().padStart(2, "0")}:30`);
  }

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

  const handleHoursChange = (index, field, value) => {
    setBusinessHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
      const payload = { name, businessHours };
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

          <h3>Business Hours</h3>
          {days.map((day, index) => (
            <div key={day} className="business-hours-row">
              <label>{day}</label>
              <select
                value={businessHours[index].open}
                onChange={(e) =>
                  handleHoursChange(index, "open", e.target.value)
                }
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <span>to</span>
              <select
                value={businessHours[index].close}
                onChange={(e) =>
                  handleHoursChange(index, "close", e.target.value)
                }
              >
                {timeOptions
                  .filter((time) => time > businessHours[index].open)
                  .map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
              </select>
            </div>
          ))}

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

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
  const [businessHours, setBusinessHours] = useState([]);
  const [holiday, setHoliday] = useState({
    start_date: "",
    end_date: "",
    reason: "",
    proof: null,
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 8; h <= 17; h++) {
      options.push(`${h.toString().padStart(2, "0")}:00`);
      if (h < 17) options.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return options;
  };
  const timeOptions = generateTimeOptions();

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

    if (user?.role === "Admin") {
      axios
        .get("http://localhost:5001/api/business-hours")
        .then((res) => {
          const cleanTimes = res.data.map((entry) => ({
            ...entry,
            start_time: entry.start_time.slice(0, 5),
            end_time: entry.end_time.slice(0, 5),
          }));
          setBusinessHours(cleanTimes);
        })
        .catch((err) => console.error("Failed to load business hours:", err));
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, oldPassword, newPassword } = form;

    if (!name.trim()) return setMessage("Name cannot be empty.");
    if (newPassword && !/^(?=.*[a-zA-Z])(?=.*\d).{3,8}$/.test(newPassword)) {
      return setMessage(
        "Password must be 3–8 characters and include at least one letter and one number."
      );
    }

    try {
      const payload = { name };
      if (newPassword) {
        if (!oldPassword) return setMessage("Enter current password.");
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

  const handleBusinessHourChange = (day, field, value) => {
    setBusinessHours((prev) =>
      prev.map((entry) =>
        entry.day_of_week === day ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSaveHours = async () => {
    try {
      await axios.put(
        "http://localhost:5001/api/business-hours",
        businessHours
      );
      alert("Business hours updated.");
    } catch (err) {
      console.error("Failed to save business hours:", err);
      alert("Error saving hours.");
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-cards-wrapper">
        <div className="settings-card">
          <h2>Settings</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            <label>Email (cannot change)</label>
            <input type="email" value={user.email} disabled />
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleProfileChange}
              required
            />
            <label>Phone</label>
            <input type="text" value={form.phone} disabled />
            <label>Old Password</label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleProfileChange}
            />
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleProfileChange}
            />
            <button type="submit" className="save-btn">
              Save Changes
            </button>
            {message && <p className="settings-message">{message}</p>}
          </form>
        </div>

        {user.role === "Admin" && (
          <div className="settings-card">
            <h2>Business Hours</h2>
            <table className="business-hours-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const entry = businessHours.find(
                    (e) => e.day_of_week === day
                  ) || {
                    day_of_week: day,
                    start_time: "08:00",
                    end_time: "17:00",
                  };

                  return (
                    <tr key={day}>
                      <td>{day}</td>
                      <td>
                        <select
                          value={entry.start_time}
                          onChange={(e) =>
                            handleBusinessHourChange(
                              day,
                              "start_time",
                              e.target.value
                            )
                          }
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={entry.end_time}
                          onChange={(e) =>
                            handleBusinessHourChange(
                              day,
                              "end_time",
                              e.target.value
                            )
                          }
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button onClick={handleSaveHours} className="save-btn">
              Save Business Hours
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;

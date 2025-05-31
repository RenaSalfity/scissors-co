import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Settings.css";

const API_BASE = "http://localhost:5001";

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
    start_time: "",
    end_time: "",
    note: "",
  });

  const [newVat, setNewVat] = useState("");
  const [vatStartDate, setVatStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [currentVat, setCurrentVat] = useState(null);
  const [vatMsg, setVatMsg] = useState("");

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
    for (let h = 0; h <= 23; h++) {
      options.push(`${h.toString().padStart(2, "0")}:00`);
      options.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (user?.email) {
      axios.get(`${API_BASE}/users/${user.email}`).then((res) => {
        setForm((prev) => ({
          ...prev,
          name: res.data.name,
          phone: res.data.phone,
        }));
      });
    }

    if (user?.role === "Admin") {
      axios
        .get(`${API_BASE}/api/business-hours`)
        .then((res) => {
          const cleanTimes = res.data.map((entry) => ({
            ...entry,
            start_time: entry.start_time.slice(0, 5),
            end_time: entry.end_time.slice(0, 5),
          }));
          setBusinessHours(cleanTimes);
        })
        .catch((err) => console.error("Failed to load business hours:", err));

      axios
        .get(`${API_BASE}/api/vat/current`)
        .then((res) => setCurrentVat(res.data?.percentage || null))
        .catch(() => setCurrentVat(null));
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

      await axios.put(`${API_BASE}/api/users/${user.id}/profile`, payload);
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
      await axios.put(`${API_BASE}/api/business-hours`, businessHours);
      alert("Business hours updated.");
    } catch (err) {
      console.error("Failed to save business hours:", err);
      alert("Error saving hours.");
    }
  };

  const submitSpecialHours = async () => {
    const { start_date, start_time, end_time, reason, note } = holiday;
    if (!start_date || !reason)
      return alert("Please select a date and reason.");

    if (
      (start_time === "" && end_time !== "") ||
      (end_time === "" && start_time !== "")
    ) {
      return alert(
        "Both start and end times must be selected, or leave both as '-- Closed --'"
      );
    }

    try {
      await axios.put(`${API_BASE}/api/special-hours`, {
        date: start_date,
        start_time: start_time || "",
        end_time: end_time || "",
        note: note || "",
        reason,
      });

      alert("Special hours saved.");
      setHoliday({
        start_date: "",
        end_date: "",
        reason: "",
        proof: null,
        start_time: "",
        end_time: "",
        note: "",
      });
    } catch (err) {
      console.error("❌ Failed to save special hours:", err);
      alert("Error saving special hours.");
    }
  };

  const handleVatSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/vat`, {
        percentage: parseFloat(newVat),
        start_date: vatStartDate,
      });
      setVatMsg("VAT updated successfully.");
      setNewVat("");
      setVatStartDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error("VAT update failed:", err);
      setVatMsg("Failed to update VAT.");
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-cards-wrapper">
        {/* Profile Settings */}
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

        {/* Admin Sections */}
        {user.role === "Admin" && (
          <>
            {/* Business Hours */}
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

            {/* Special Hours */}
            <div className="settings-card">
              <h2>Special Business Hours</h2>
              <div className="settings-form">
                <label>Pick a Date</label>
                <input
                  type="date"
                  value={holiday.start_date}
                  onChange={(e) =>
                    setHoliday((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  min={todayStr}
                />
                <label>Reason</label>
                <select
                  value={holiday.reason}
                  onChange={(e) =>
                    setHoliday((prev) => ({ ...prev, reason: e.target.value }))
                  }
                >
                  <option value="">-- Select Reason --</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Other">Other</option>
                </select>
                <label>Start Time</label>
                <select
                  value={holiday.start_time || ""}
                  onChange={(e) =>
                    setHoliday((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                      end_time: e.target.value === "" ? "" : prev.end_time,
                    }))
                  }
                >
                  <option value="">-- Closed --</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label>End Time</label>
                <select
                  value={holiday.end_time || ""}
                  onChange={(e) =>
                    setHoliday((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                      start_time: e.target.value === "" ? "" : prev.start_time,
                    }))
                  }
                >
                  <option value="">-- Closed --</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label>Note</label>
                <input
                  type="text"
                  value={holiday.note || ""}
                  onChange={(e) =>
                    setHoliday((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
                <button onClick={submitSpecialHours} className="save-btn">
                  Save Special Hours
                </button>
              </div>
            </div>

            {/* VAT Settings */}
            <div className="settings-card">
              <h2>VAT Settings</h2>
              <p>
                Current VAT:{" "}
                {currentVat !== null ? `${currentVat}%` : "Loading..."}
              </p>
              <form onSubmit={handleVatSubmit} className="settings-form">
                <label>New VAT Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newVat}
                  onChange={(e) => setNewVat(e.target.value)}
                  required
                />
                <label>Start Date</label>
                <input
                  type="date"
                  value={vatStartDate}
                  onChange={(e) => setVatStartDate(e.target.value)}
                  required
                />
                <button type="submit" className="save-btn">
                  Update VAT
                </button>
                {vatMsg && <p>{vatMsg}</p>}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Settings;

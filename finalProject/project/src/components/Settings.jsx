import React, { useEffect, useState } from "react";
import axios from "axios";
import "../assets/styles/Settings.css";

function Settings({ user }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [businessHours, setBusinessHours] = useState(
    Array(7).fill({ open: "08:00", close: "17:00" })
  );

  const [vacation, setVacation] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    if (user?.email) {
      axios
        .get(`http://localhost:5001/users/${user.email}`)
        .then((res) => {
          setForm({
            name: res.data.name,
            phone: res.data.phone,
            password: "",
          });
        })
        .catch(() => setMessage("Failed to load profile."));
    }
  }, [user?.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`http://localhost:5001/users/${user.id}`, form)
      .then(() => setMessage("Profile updated successfully!"))
      .catch(() => setMessage("Update failed."));
  };

  const generateHours = (start, end) => {
    const hours = [];
    for (let h = start; h <= end; h++) {
      const label = h.toString().padStart(2, "0") + ":00";
      hours.push(label);
    }
    return hours;
  };

  const handleHourChange = (index, type, value) => {
    setBusinessHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [type]: value };
      return updated;
    });
  };

  const handleBusinessHoursSubmit = (e) => {
    e.preventDefault();
    console.log("Business hours submitted:", businessHours);
    alert("Business hours saved! (not implemented yet)");
  };

  const handleVacationSubmit = (e) => {
    e.preventDefault();
    console.log("Vacation request submitted:", vacation);
    alert("בקשת החופשה נשלחה (מדומה)");
    setVacation({ startDate: "", endDate: "", reason: "" });
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2 className="settings-title">Settings</h2>

        <div className="settings-flex">
          {/* ✅ טופס פרטים אישיים */}
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
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            <label>New Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />

            <button type="submit" className="save-btn">
              Save Changes
            </button>

            {message && <p className="settings-message">{message}</p>}
          </form>

          {/* ✅ טופס שעות פעילות (מנהל בלבד) */}
          {user.role === "Admin" && (
            <form
              onSubmit={handleBusinessHoursSubmit}
              className="business-hours form-right"
            >
              <h3>שעות פעילות העסק</h3>
              <table className="hours-table">
                <thead>
                  <tr>
                    <th>יום</th>
                    <th>שעת פתיחה</th>
                    <th>שעת סגירה</th>
                  </tr>
                </thead>
                <tbody>
                  {["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"].map(
                    (day, index) => (
                      <tr key={index}>
                        <td>{day}</td>
                        <td>
                          <select
                            value={businessHours[index].open}
                            onChange={(e) =>
                              handleHourChange(index, "open", e.target.value)
                            }
                          >
                            {generateHours(8, 23).map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={businessHours[index].close}
                            onChange={(e) =>
                              handleHourChange(index, "close", e.target.value)
                            }
                          >
                            {generateHours(9, 24).map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              <button
                type="submit"
                className="save-btn"
                style={{ marginTop: "20px" }}
              >
                שמור שעות פעילות
              </button>
            </form>
          )}
        </div>

        {/* ✅ טופס בקשת חופשה (לעובד בלבד) */}
        {user.role === "Employee" && (
          <form className="vacation-form" onSubmit={handleVacationSubmit}>
            <h3>בקשת חופשה</h3>

            <label>תאריך התחלה</label>
            <input
              type="date"
              value={vacation.startDate}
              onChange={(e) =>
                setVacation({ ...vacation, startDate: e.target.value })
              }
              required
            />

            <label>תאריך סיום</label>
            <input
              type="date"
              value={vacation.endDate}
              onChange={(e) =>
                setVacation({ ...vacation, endDate: e.target.value })
              }
              required
            />

            <label>סיבה (אופציונלית)</label>
            <input
              type="text"
              value={vacation.reason}
              onChange={(e) =>
                setVacation({ ...vacation, reason: e.target.value })
              }
              placeholder="סיבה לחופשה"
            />

            <button
              type="submit"
              className="save-btn"
              style={{ marginTop: "20px" }}
            >
              שלח בקשה
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Settings;

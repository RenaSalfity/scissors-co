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

  const [holiday, setHoliday] = useState({
    start_date: "",
    end_date: "",
    reason: "",
    proof: null,
  });

  const todayStr = new Date().toISOString().split("T")[0];

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
        if (!oldPassword)
          return setMessage("Please enter your current password.");
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

  const handleHolidayChange = (e) => {
    const { name, value } = e.target;
    setHoliday((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setHoliday((prev) => ({ ...prev, proof: e.target.files[0] }));
  };

  const submitHoliday = async () => {
    if (!holiday.start_date || !holiday.end_date || !holiday.reason) {
      alert("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("employee_id", user.id);
    formData.append("start_date", holiday.start_date);
    formData.append("end_date", holiday.end_date);
    formData.append("reason", holiday.reason);
    if (holiday.reason === "Sick" && holiday.proof) {
      formData.append("proof", holiday.proof);
    }

    try {
      await axios.post("http://localhost:5001/api/holidays", formData);
      alert("Holiday request submitted");
      setHoliday({ start_date: "", end_date: "", reason: "", proof: null });
    } catch (err) {
      console.error("Failed to submit holiday:", err);
      alert("Error submitting request.");
    }
  };

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
  }, [user]);

  return (
    <div className="settings-container">
      <div className="settings-cards-wrapper">
        {/* Profile Card */}
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
              value={form.oldPassword || ""}
              onChange={handleProfileChange}
            />

            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword || ""}
              onChange={handleProfileChange}
            />

            <button type="submit" className="save-btn">
              Save Changes
            </button>
            {message && <p className="settings-message">{message}</p>}
          </form>
        </div>

        {/* Holiday Card */}
        {user.role === "Employee" && (
          <div className="settings-card">
            <h2>Request Time Off</h2>
            <div className="settings-form">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={holiday.start_date}
                onChange={handleHolidayChange}
                min={todayStr}
              />

              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={holiday.end_date}
                onChange={handleHolidayChange}
                min={holiday.start_date || todayStr}
              />

              <label>Reason</label>
              <select
                name="reason"
                value={holiday.reason}
                onChange={handleHolidayChange}
              >
                <option value="">-- Select Reason --</option>
                <option value="Sick">Sick</option>
                <option value="חופש">חופש</option>
                <option value="Travel">Travel</option>
              </select>

              {holiday.reason === "Sick" && (
                <>
                  <label>Doctor Note (PDF, JPG, PNG)</label>
                  <input
                    type="file"
                    name="proof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </>
              )}

              <button onClick={submitHoliday} className="save-btn">
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;

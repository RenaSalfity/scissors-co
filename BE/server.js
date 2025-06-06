const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const authRoutes = require("./routes/auth");
const emailVerifications = {};
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "scissorsco2025@gmail.com",
    pass: "houh fuha uoft bjgl",
  },
});

const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);

// ✅ DB connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "scissors&co.",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to the database");
});

// ✅ Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(401).json({ error: "User not found" });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (!isMatch)
        return res.status(401).json({ error: "Incorrect password" });

      res.json({ id: user.id, email: user.email, role: user.role });
    });
  });
});

// ✅ Categories routes
app.post("/categories", upload.single("image"), (req, res) => {
  const { name } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !image) {
    return res.status(400).json({ error: "Missing category name or image" });
  }

  db.query(
    "INSERT INTO categories (name, image) VALUES (?, ?)",
    [name, image],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Database error", details: err });
      res
        .status(201)
        .json({ message: "Category added successfully", id: result.insertId });
    }
  );
});

app.get("/categories", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});

app.get("/categories/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM categories WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json(results[0]);
  });
});

// ✅ Services routes
app.post("/services", (req, res) => {
  const { name, price, time, category_id, employee_ids = [] } = req.body;
  const sql = `
    INSERT INTO services (name, price, time, category_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, price, time, category_id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const serviceId = result.insertId;

    if (employee_ids.length === 0) {
      return res.json({ message: "Service added", id: serviceId });
    }

    const linkSql = `
      INSERT INTO employee_services (service_id, employee_id)
      VALUES ?
    `;
    const values = employee_ids.map((eid) => [serviceId, eid]);

    db.query(linkSql, [values], (err2) => {
      if (err2) {
        console.error("❌ Failed to link employees:", err2);
        return res.status(500).json({ error: "Linking error" });
      }

      res.json({ message: "Service added with employees", id: serviceId });
    });
  });
});

app.get("/services/:categoryId", (req, res) => {
  const categoryId = req.params.categoryId;
  const sql = "SELECT * FROM services WHERE category_id = ?";
  db.query(sql, [categoryId], (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});
// Route to Fetch Assigned Employees for a Service
app.get("/services/:id/employees", (req, res) => {
  const serviceId = req.params.id;
  const sql = `
    SELECT u.id, u.name
    FROM employee_services se
    JOIN users u ON se.employee_id = u.id
    WHERE se.service_id = ?
  `;

  db.query(sql, [serviceId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch employees for service:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// ✅ NEW: Get all services
app.get("/api/services", (req, res) => {
  const sql = "SELECT id, name, price FROM services";
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});
app.get("/api/employees/active", (req, res) => {
  const sql = `
    SELECT id, name
    FROM users
    WHERE role = 'Employee'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch active employees:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
// ✅ NEW: Get all employees
app.get("/api/employees", (req, res) => {
  const sql = `
    SELECT id, name, email, phone, role
    FROM users
    WHERE role = 'Employee' OR was_employee = 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch employees:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
// ✅ Update service
app.put("/services/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, time, employee_ids } = req.body;

  const updateServiceSql = `
    UPDATE services
    SET name = ?, price = ?, time = ?
    WHERE id = ?
  `;

  db.query(updateServiceSql, [name, price, time, id], (err, result) => {
    if (err) {
      console.error("❌ Error updating service:", err);
      return res.status(500).json({ error: "Failed to update service" });
    }

    // ✅ Update the employee_services table
    const deleteSql = "DELETE FROM employee_services WHERE service_id = ?";
    db.query(deleteSql, [id], (delErr) => {
      if (delErr) {
        console.error("❌ Failed to clear employee_services:", delErr);
        return res
          .status(500)
          .json({ error: "Failed to clear employee_services" });
      }

      if (!employee_ids || employee_ids.length === 0) {
        return res.json({ message: "Service updated with no employees" });
      }

      const insertSql =
        "INSERT INTO employee_services (service_id, employee_id) VALUES ?";
      const insertValues = employee_ids.map((empId) => [id, empId]);

      db.query(insertSql, [insertValues], (insErr) => {
        if (insErr) {
          console.error("❌ Failed to insert employee_services:", insErr);
          return res
            .status(500)
            .json({ error: "Failed to insert employee_services" });
        }

        res.json({ message: "Service and employees updated successfully" });
      });
    });
  });
});

// Get employees assigned to a specific service
app.get("/api/service-employees/:serviceId", (req, res) => {
  const { serviceId } = req.params;
  const sql = `SELECT employee_id FROM employee_services WHERE service_id = ?`;

  db.query(sql, [serviceId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch assigned employees:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const employeeIds = results.map((row) => row.employee_id);
    res.json({ employeeIds });
  });
});

// ✅ Delete service
app.delete("/services/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM services WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  });
});

// ✅ Delete category
app.delete("/categories/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM categories WHERE id = ?", [id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json({ message: "Category deleted successfully" });
  });
});

// ✅ Update category
app.put("/categories/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.file ? req.file.filename : null;

  let sql;
  let values;
  if (image) {
    sql = "UPDATE categories SET name = ?, image = ? WHERE id = ?";
    values = [name, image, id];
  } else {
    sql = "UPDATE categories SET name = ? WHERE id = ?";
    values = [name, id];
  }

  db.query(sql, values, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json({ message: "Category updated successfully" });
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

//emails in db
app.get("/api/users/check-email", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const sql = "SELECT id FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });

    if (results.length === 0) {
      res.json({ exists: false });
    } else {
      res.json({ exists: true });
    }
  });
});

// ✅ Get all customers
app.get("/api/customers", (req, res) => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE role = 'Customer' AND was_employee = 0
  `;
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});
// ✅ Update user role (Employee <--> Customer)
app.put("/api/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["Admin", "Customer", "Employee"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  let sql = "";
  if (role === "Employee") {
    // Promote ➜ was_employee = 0
    sql = "UPDATE users SET role = ?, was_employee = 0 WHERE id = ?";
  } else if (role === "Customer") {
    // Deactivate ➜ was_employee = 1
    sql = "UPDATE users SET role = ?, was_employee = 1 WHERE id = ?";
  } else {
    sql = "UPDATE users SET role = ? WHERE id = ?";
  }

  db.query(sql, [role, id], (err, result) => {
    if (err) {
      console.error("❌ Failed to update role:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, message: `Role changed to ${role}` });
  });
});
app.get("/api/available-times", (req, res) => {
  const { date, employeeId, serviceId } = req.query;

  console.log("📥 Request Params:", { date, employeeId, serviceId });

  if (!date || !employeeId || !serviceId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
  });

  const fallbackDuration = 30;
  const slotInterval = 15;

  // Step 1: Get service duration
  const durationQuery = "SELECT time FROM services WHERE id = ?";
  db.query(durationQuery, [serviceId], (err, result) => {
    if (err || result.length === 0) {
      console.error("❌ Error fetching service duration:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch service duration" });
    }

    const serviceDuration = Number(result[0].time) || fallbackDuration;
    console.log("⏱️ Service Duration:", serviceDuration);

    // Step 2: Check for special hours
    const specialQuery =
      "SELECT start_time, end_time FROM special_hours WHERE date = ?";
    db.query(specialQuery, [date], (err2, special) => {
      if (err2) {
        console.error("Error checking special hours:", err2);
        return res.status(500).json({ error: "Error checking special hours" });
      }

      if (special.length > 0) {
        // Check if salon is closed that day
        if (!special[0].start_time || !special[0].end_time) {
          console.log("Closed on this date due to special hours.");
          return res.json([]);
        }

        proceedWithHours(special[0].start_time, special[0].end_time);
      } else {
        // Fallback to default working hours
        const hoursQuery = `
          SELECT start_time, end_time FROM working_hours
          WHERE day_of_week = ?
          LIMIT 1
        `;
        db.query(hoursQuery, [dayOfWeek], (err3, hoursResult) => {
          if (err3 || hoursResult.length === 0) {
            console.error("❌ Error fetching working hours:", err3);
            return res.status(400).json({ error: "No working hours found" });
          }

          proceedWithHours(hoursResult[0].start_time, hoursResult[0].end_time);
        });
      }
    });

    // Step 3: Continue with slot generation
    function proceedWithHours(startTime, endTime) {
      const [startH, startM] = startTime.substring(0, 5).split(":").map(Number);
      const [endH, endM] = endTime.substring(0, 5).split(":").map(Number);
      const openMinutes = startH * 60 + startM;
      const closeMinutes = endH * 60 + endM;

      const apptQuery = `
        SELECT a.time AS appointmentTime, s.time AS serviceDuration
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.employee_id = ? AND a.date = ?
      `;

      db.query(apptQuery, [employeeId, date], (err4, appts) => {
        if (err4) {
          console.error("❌ Error fetching appointments:", err4);
          return res
            .status(500)
            .json({ error: "Failed to fetch appointments" });
        }

        const booked = appts.map(({ appointmentTime, serviceDuration }) => {
          const [h, m] = appointmentTime.split(":").map(Number);
          const start = h * 60 + m;
          const end = start + Number(serviceDuration);
          return { start, end };
        });

        const available = [];
        for (
          let t = openMinutes;
          t + serviceDuration <= closeMinutes;
          t += slotInterval
        ) {
          const end = t + serviceDuration;
          const overlaps = booked.some(
            (b) => Math.max(t, b.start) < Math.min(end, b.end)
          );

          if (!overlaps) {
            const hour = String(Math.floor(t / 60)).padStart(2, "0");
            const minute = String(t % 60).padStart(2, "0");
            available.push(`${hour}:${minute}`);
          }
        }

        console.log("✅ Available Slots:", available);
        res.json(available);
      });
    }
  });
});
app.get("/api/business-hours/closed-days", (req, res) => {
  const sqlClosed = `
    SELECT day_of_week FROM working_hours
    WHERE start_time = '00:00:00' AND end_time = '00:00:00'
  `;

  const sqlSpecial = `SELECT date, start_time, end_time FROM special_hours`;

  db.query(sqlClosed, (err1, closedRes) => {
    if (err1)
      return res.status(500).json({ error: "DB error (working_hours)" });

    db.query(sqlSpecial, (err2, specialRes) => {
      if (err2)
        return res.status(500).json({ error: "DB error (special_hours)" });

      const closedDays = closedRes.map((r) => r.day_of_week);
      const specialOverride = {};
      specialRes.forEach((row) => {
        specialOverride[row.date] = {
          start_time: row.start_time,
          end_time: row.end_time,
        };
      });

      res.json({ closedDays, specialOverride });
    });
  });
});

app.get("/api/holidays/:employeeId/disabled-dates", (req, res) => {
  const { employeeId } = req.params;

  const sql = `
    SELECT start_date, end_date FROM holidays
    WHERE employee_id = ?
  `;

  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch holidays:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const dates = new Set();

    results.forEach(({ start_date, end_date }) => {
      let curr = new Date(start_date);
      const end = new Date(end_date);

      while (curr <= end) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, "0");
        const dd = String(curr.getDate()).padStart(2, "0");
        dates.add(`${yyyy}-${mm}-${dd}`);
        curr.setDate(curr.getDate() + 1);
      }
    });

    res.json(Array.from(dates));
  });
});

app.put("/api/business-hours", (req, res) => {
  const hours = req.body; // Array of 7 entries

  const sql = `
    UPDATE working_hours
    SET start_time = ?, end_time = ?
    WHERE day_of_week = ?
  `;

  let completed = 0;
  let hasError = false;
  hours.forEach(({ day_of_week, start_time, end_time }) => {
    const sql = `
      UPDATE working_hours
      SET start_time = ?, end_time = ?
      WHERE day_of_week = ?
    `;

    const safeStart = start_time === "" ? null : start_time;
    const safeEnd = end_time === "" ? null : end_time;

    db.query(sql, [safeStart, safeEnd, day_of_week], (err) => {
      if (err && !hasError) {
        console.error("❌ Error updating business hour:", err);
        hasError = true;
        return res.status(500).json({ error: "Database error" });
      }

      completed++;
      if (completed === hours.length && !hasError) {
        res.json({ message: "Business hours updated successfully." });
      }
    });
  });
});

app.get("/api/customers/details", (req, res) => {
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      COUNT(a.id) AS totalAppointments,
      COALESCE(SUM(s.price), 0) AS totalSpent,
      SUM(CASE WHEN a.date >= CURDATE() THEN 1 ELSE 0 END) AS upcomingAppointments
    FROM users u
    LEFT JOIN appointments a ON u.id = a.customer_id
    LEFT JOIN services s ON a.service_id = s.id
    GROUP BY u.id, u.name, u.email, u.role
    HAVING u.role = 'Customer' OR totalAppointments > 0
    ORDER BY totalAppointments DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch customer data:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.json(results);
  });
});

// ✅ All users who had at least one appointment
app.get("/api/customers", (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email, u.role,
           COUNT(a.id) AS appointmentsCount,
           SUM(s.price) AS totalSpent,
           MAX(a.date) AS lastAppointment,
           MIN(a.date) AS firstAppointment
    FROM users u
    JOIN appointments a ON u.email = a.customer_email
    JOIN services s ON a.service_id = s.id
    GROUP BY u.id, u.name, u.email, u.role
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.json(results);
  });
});

// ✅ Get all users with appointments summary
app.get("/api/customers/summary", (req, res) => {
  const sql = `
    SELECT 
  u.id, u.name, u.email, u.role,
  a.date, a.time, s.name AS service, s.price
FROM users u
JOIN appointments a ON u.id = a.customer_id
JOIN services s ON a.service_id = s.id
ORDER BY u.id, a.date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error in /customers/summary:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    const summaryMap = {};

    results.forEach((row) => {
      if (!summaryMap[row.id]) {
        summaryMap[row.id] = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          appointments: [],
        };
      }

      summaryMap[row.id].appointments.push({
        date: row.date,
        time: row.time,
        service: row.service,
        price: row.price,
      });
    });

    const output = Object.values(summaryMap);
    res.json(output);
  });
});

app.get("/api/appointments", (req, res) => {
  const { view, start, end, employeeId, customerId } = req.query;

  let sql = `
    SELECT a.*, 
           u1.name AS customer_name, 
           u2.name AS employee_name, 
           s.name AS service_name,
           s.price
    FROM appointments a
    LEFT JOIN users u1 ON a.customer_id = u1.id
    LEFT JOIN users u2 ON a.employee_id = u2.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE 1
  `;

  const params = [];

  // Apply date range
  if (start && end) {
    sql += " AND a.date BETWEEN ? AND ?";
    params.push(start, end);
  }

  // Filter by employee
  if (employeeId) {
    sql += " AND a.employee_id = ?";
    params.push(employeeId);
  }

  // ✅ Filter by customer
  if (customerId) {
    sql += " AND a.customer_id = ?";
    params.push(customerId);
  }

  // Optional view mode (e.g. group by week/year)
  if (view === "week") {
    sql += " ORDER BY a.date DESC, a.time DESC";
  } else {
    sql += " ORDER BY a.date ASC, a.time ASC";
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching appointments:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.json(results);
  });
});

// ✅ Check if employee has any appointments before demotion
// ✅ Step 1: Get employee's appointments (not cancelled)
app.get("/api/employees/:id/appointments", (req, res) => {
  const employeeId = req.params.id;

  const sql = `
    SELECT a.id, a.date, a.time, a.status,
           u.name AS customer_name, u.email AS customer_email,
           s.name AS service_name
    FROM appointments a
    LEFT JOIN users u ON a.customer_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.employee_id = ? AND (a.status IS NULL OR a.status NOT LIKE 'cancelled%')
  `;

  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch appointments:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      total: results.length,
      appointments: results, // each has: id, date, time, customer_name, customer_email, service_name
    });
  });
});
app.put("/api/users/:id/profile", (req, res) => {
  const { id } = req.params;
  const { name, oldPassword, newPassword } = req.body;

  const getUserSql = "SELECT email, name, password FROM users WHERE id = ?";
  db.query(getUserSql, [id], (err, results) => {
    if (err || results.length === 0)
      return res.status(500).json({ error: "User not found" });

    const user = results[0];
    const userEmail = user.email;
    const oldName = user.name;

    const sendNotification = (changesText) => {
      const mailOptions = {
        from: "Scissors&Co <scissorsco2025@gmail.com>",
        to: userEmail,
        subject: "Your profile was updated",
        text: `Hi ${name},\n\n${changesText}\n\nIf you did not make this change, please contact support immediately.\n\n— Scissors & Co.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Failed to send profile update email:", error);
        } else {
          console.log("✅ Profile update email sent:", info.response);
        }
      });
    };

    const updateName = () => {
      db.query("UPDATE users SET name = ? WHERE id = ?", [name, id], (err) => {
        if (err)
          return res.status(500).json({ error: "Failed to update name" });

        let changesText = "";
        if (oldName !== name) {
          changesText = `Your name was updated from "${oldName}" to "${name}".`;
        } else {
          changesText = `Your profile was updated (no visible changes).`;
        }

        sendNotification(changesText);
        res.json({ message: "Profile updated" });
      });
    };

    // 🟠 If no password is being updated — just update name
    if (!newPassword) {
      updateName();
    } else {
      // 🔐 Update password after verifying old password
      bcrypt.compare(oldPassword, user.password, (err, match) => {
        if (err || !match)
          return res.status(401).json({ error: "Incorrect old password" });

        bcrypt.hash(newPassword, 10, (err, hash) => {
          if (err) return res.status(500).json({ error: "Hashing failed" });

          db.query(
            "UPDATE users SET name = ?, password = ? WHERE id = ?",
            [name, hash, id],
            (err) => {
              if (err)
                return res
                  .status(500)
                  .json({ error: "Failed to update profile" });

              let changesText = "";

              if (oldName !== name && newPassword) {
                changesText = `Your name was updated from "${oldName}" to "${name}", and your password was changed.`;
              } else if (oldName !== name) {
                changesText = `Your name was updated from "${oldName}" to "${name}".`;
              } else {
                changesText = `Your password was changed.`;
              }

              sendNotification(changesText);
              res.json({ message: "Profile and password updated" });
            }
          );
        });
      });
    }
  });
});
app.put("/api/appointments/cancel-by-business", (req, res) => {
  const { employeeId, appointments } = req.body;

  if (!Array.isArray(appointments)) {
    return res.status(400).json({ error: "Appointments must be an array" });
  }

  // Step 1: Cancel appointments
  const appointmentIds = appointments.map((a) => a.id);
  const sql = `
    UPDATE appointments
    SET status = 'cancelled by business'
    WHERE id IN (?)
  `;

  db.query(sql, [appointmentIds], async (err) => {
    if (err) {
      console.error("❌ Failed to cancel appointments:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Step 2: Send email to customers
    for (const appt of appointments) {
      const message = `
        Hello ${appt.customer_name},<br/><br/>
        We regret to inform you that your appointment on <strong>${appt.date}</strong> at <strong>${appt.time}</strong>
        for the service <strong>${appt.service_name}</strong> has been cancelled by the business.<br/><br/>
        Sorry for the inconvenience,<br/>
        Scissors & Co.
      `;

      await transporter.sendMail({
        from: "scissorsco2025@gmail.com",
        to: appt.customer_email,
        subject: "Appointment Cancelled by Business",
        html: message,
      });
    }

    res.json({
      success: true,
      message: "Appointments cancelled and notifications sent.",
    });
  });
});
// ✅ Get user details by email (used in Settings.jsx)
app.get("/users/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);

  const sql = "SELECT id, name, phone, email FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Error fetching user by email:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result[0]);
  });
});

app.post("/api/send-code", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
  emailVerifications[email] = { code, expiresAt };

  const mailOptions = {
    from: "Scissors&Co <scissorsco2025@gmail.com>",
    to: email,
    subject: "Your Scissors&Co Verification Code",
    text: `Your verification code is: ${code}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("❌ Failed to send email:", err);
      return res.status(500).json({ error: "Failed to send email" });
    }
    res.json({ message: "Verification code sent" });
  });
});

// ✅ Route to verify the code
app.post("/api/verify-code", (req, res) => {
  const { email, code } = req.body;
  const record = emailVerifications[email];
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  emailVerifications[email].verified = true;
  res.json({ message: "Email verified" });
});

// ✅ Modified signup route (ensure email is verified first)
app.post("/api/auth/signup", (req, res) => {
  const { name, phone, email, password } = req.body;

  const record = emailVerifications[email];
  if (!record || !record.verified) {
    return res.status(403).json({ error: "Email not verified" });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Hashing failed" });

    const sql =
      "INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, 'Customer')";
    db.query(sql, [name, phone, email, hash], (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      delete emailVerifications[email];
      res.status(201).json({ message: "Signup successful" });
    });
  });
});

//business hours and appointments
app.get("/api/business-hours", (req, res) => {
  const sql = `
    SELECT day_of_week, start_time, end_time
    FROM working_hours
    ORDER BY FIELD(day_of_week, 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to get business hours:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
// ✅ Route: Check appointments for a specific day before marking as Closed
app.get("/api/business-hours/check-day", (req, res) => {
  const { dayOfWeek } = req.query;

  if (!dayOfWeek) {
    return res.status(400).json({ error: "Missing dayOfWeek" });
  }

  const sql = `
    SELECT COUNT(*) AS count
    FROM appointments
    WHERE DAYNAME(date) = ?
      AND (status IS NULL OR status NOT LIKE 'cancelled%')
  `;

  db.query(sql, [dayOfWeek], (err, results) => {
    if (err) {
      console.error("❌ Failed to count appointments:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ count: results[0].count });
  });
});
//if the employee was sick
app.post("/api/holidays", upload.single("proof"), (req, res) => {
  const { employee_id, start_date, end_date, reason } = req.body;
  const filePath = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO holidays (employee_id, start_date, end_date, reason, proof_file)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [employee_id, start_date, end_date, reason, filePath],
    (err, result) => {
      if (err) {
        console.error("❌ Failed to insert holiday:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Holiday request submitted", id: result.insertId });
    }
  );
});
//proof of being sick
app.post("/api/holidays/:id/proof", upload.single("proof"), (req, res) => {
  const { id } = req.params;
  const filePath = req.file ? req.file.filename : null;

  if (!filePath) return res.status(400).json({ error: "Missing file" });

  const sql = `UPDATE holidays SET proof_file = ? WHERE id = ?`;
  db.query(sql, [filePath, id], (err) => {
    if (err) {
      console.error("❌ Failed to upload sick note:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Proof uploaded successfully" });
  });
});

app.put("/api/holidays/check-missing-proof", (req, res) => {
  const sql = `
    UPDATE holidays
    SET reason = 'Time Off', updated_to_time_off = 1
    WHERE reason = 'Sick'
      AND proof_file IS NULL
      AND updated_to_time_off = 0
      AND LAST_DAY(submitted_at) < CURDATE()
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Failed to downgrade expired sick leaves:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      message: `Updated ${result.affectedRows} sick leave(s) to Time Off`,
    });
  });
});

// ✅ Get holidays for a specific employee
app.get("/api/holidays/:employeeId", (req, res) => {
  const { employeeId } = req.params;
  const sql = `
    SELECT id, start_date, end_date, reason, proof_file, submitted_at
    FROM holidays
    WHERE employee_id = ?
    ORDER BY start_date DESC
  `;
  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch holidays:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ✅ Return only employees NOT on holiday for the given date
app.get("/api/employees/available", (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Missing date" });
  }

  const sql = `
    SELECT id, name FROM users
    WHERE role = 'Employee'
    AND id NOT IN (
      SELECT employee_id
      FROM holidays
      WHERE ? BETWEEN start_date AND end_date
    )
  `;

  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch available employees:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ✅ Book an appointment and send email
app.post("/api/appointments", (req, res) => {
  const { customerEmail, serviceId, employeeId, date, time } = req.body;

  if (!customerEmail || !serviceId || !employeeId || !date || !time) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Step 1: Get customer ID and name from email
  const userSql = "SELECT id, name FROM users WHERE email = ?";
  db.query(userSql, [customerEmail], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(400).json({ error: "Customer not found" });
    }

    const customerId = userResult[0].id;
    const customerName = userResult[0].name;

    // Step 2: Get employee name and email
    const employeeSql = "SELECT name, email FROM users WHERE id = ?";
    db.query(employeeSql, [employeeId], (err2, empResult) => {
      if (err2 || empResult.length === 0) {
        return res.status(400).json({ error: "Employee not found" });
      }

      const employeeName = empResult[0].name;
      const employeeEmail = empResult[0].email;

      // Step 3: Get service name
      const serviceSql = "SELECT name FROM services WHERE id = ?";
      db.query(serviceSql, [serviceId], (err3, serviceResult) => {
        if (err3 || serviceResult.length === 0) {
          return res.status(400).json({ error: "Service not found" });
        }

        const serviceName = serviceResult[0].name;

        // Step 4: Insert appointment
        const insertSql = `
          INSERT INTO appointments (customer_id, employee_id, service_id, date, time, status)
          VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        db.query(
          insertSql,
          [customerId, employeeId, serviceId, date, time],
          (err4, result) => {
            if (err4) {
              console.error("❌ Failed to insert appointment:", err4);
              return res
                .status(500)
                .json({ error: "Database error", details: err4 });
            }

            // Format date (DD/MM/YYYY)
            const [year, month, day] = date.split("-");
            const formattedDate = `${day}/${month}/${year}`;

            // Step 5: Send email to customer
            const mailToCustomer = {
              from: "Scissors&Co <scissorsco2025@gmail.com>",
              to: customerEmail,
              subject: "Your Appointment is Pending – Scissors & Co.",
              text: `Hello ${customerName},\n\nYour appointment is pending for ${formattedDate} at ${time} for "${serviceName}".\n\n— Scissors & Co.`,
            };

            transporter.sendMail(mailToCustomer, (err5) => {
              if (err5) {
                console.error("❌ Failed to send confirmation email:", err5);
              } else {
                console.log("📧 Customer appointment email sent.");
              }
            });

            // Step 6: Send email to employee
            const mailToEmployee = {
              from: "Scissors&Co <scissorsco2025@gmail.com>",
              to: employeeEmail,
              subject: "New Appointment Request – Scissors & Co.",
              text: `Hello ${employeeName},\n\nA new client has booked you for ${formattedDate} at ${time} for "${serviceName}".\n\n— Scissors & Co.`,
            };

            transporter.sendMail(mailToEmployee, (err6) => {
              if (err6) {
                console.error("❌ Failed to notify employee:", err6);
              } else {
                console.log("📧 Employee notified.");
              }
            });

            res
              .status(201)
              .json({ message: "Appointment booked and emails sent." });
          }
        );
      });
    });
  });
});

//add special dates in case of ocassions/special holidays
app.get("/api/special-hours/:date", (req, res) => {
  const { date } = req.params;
  const sql = "SELECT * FROM special_hours WHERE date = ?";
  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch special hours:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(Array.isArray(results) ? results : []);
  });
});

// ✅ Update special hours
app.put("/api/special-hours", (req, res) => {
  const { date, start_time, end_time, reason, note } = req.body;

  if (!date || !reason) {
    return res.status(400).json({ error: "Date and reason are required" });
  }

  const isClosed = !start_time && !end_time;
  const sql = `
    INSERT INTO special_hours (date, start_time, end_time, note)
    VALUES (?, NULLIF(?,''), NULLIF(?,''), ?)
    ON DUPLICATE KEY UPDATE
      start_time = VALUES(start_time),
      end_time = VALUES(end_time),
      note = VALUES(note)
  `;

  db.query(sql, [date, start_time, end_time, note || ""], (err, result) => {
    if (err) {
      console.error("❌ Failed to save special hours:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (isClosed) {
      const fetchSql = `
        SELECT a.id, u.email, u.name, s.name AS service_name, a.time
        FROM appointments a
        JOIN users u ON a.customer_id = u.id
        JOIN services s ON a.service_id = s.id
        WHERE a.date = ? AND a.status NOT LIKE 'cancelled%'
      `;

      db.query(fetchSql, [date], (fetchErr, appointments) => {
        if (fetchErr) {
          console.error("❌ Failed to fetch appointments:", fetchErr);
          return res.status(500).json({ error: "Database error" });
        }

        const updateSql = `
          UPDATE appointments 
          SET status = 'cancelled by business'
          WHERE date = ? AND status NOT LIKE 'cancelled%'
        `;

        db.query(updateSql, [date], (updateErr) => {
          if (updateErr) {
            console.error("❌ Failed to update appointments:", updateErr);
            return res.status(500).json({ error: "Update error" });
          }

          appointments.forEach(({ email, name, service_name, time }) => {
            const emailBody =
              reason === "Holiday"
                ? `Dear ${name},\n\nYour appointment for "${service_name}" on ${date} at ${time} has been cancelled due to the following reason:\n\n"${note}".\n\nWe apologize for the inconvenience.\n\n— Scissors & Co.`
                : `Dear ${name},\n\nYour appointment for "${service_name}" on ${date} at ${time} has been cancelled due to salon closure.\n\nWe apologize for the inconvenience.\n\n— Scissors & Co.`;

            const mailOptions = {
              from: "Scissors&Co <scissorsco2025@gmail.com>",
              to: email,
              subject: "Appointment Cancelled – Scissors & Co.",
              text: emailBody,
            };

            transporter.sendMail(mailOptions, (mailErr) => {
              if (mailErr) console.error("❌ Failed to send email:", mailErr);
            });
          });

          return res.json({
            message: `Special hours saved. ${appointments.length} appointments cancelled and customers notified.`,
          });
        });
      });
    } else {
      return res.json({ message: "Special hours saved." });
    }
  });
});

app.get("/api/special-hours/conflict-check", (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Missing date" });
  }

  const sql = `
    SELECT a.id, a.date, a.time, a.status,
           u.name AS customer_name, u.email AS customer_email,
           s.name AS service_name
    FROM appointments a
    LEFT JOIN users u ON a.customer_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE DATE(a.date) = ?
      AND (a.status IS NULL OR a.status NOT LIKE 'cancelled%')
  `;

  db.query(sql, [date], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }

    res.json(results);
  });
});
app.post("/api/business-hours/cancel-appointments", (req, res) => {
  const { dayOfWeek } = req.body;
  if (!dayOfWeek) return res.status(400).json({ error: "Missing dayOfWeek" });

  const sql = `
    SELECT a.id, u.email, u.name AS customer_name, s.name AS service_name, a.date, a.time
    FROM appointments a
    LEFT JOIN users u ON a.customer_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE DAYNAME(a.date) = ?
      AND (a.status IS NULL OR a.status NOT LIKE 'cancelled%')
  `;

  db.query(sql, [dayOfWeek], (err, appointments) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (!appointments.length) return res.json({ cancelled: 0 });

    const ids = appointments.map((a) => a.id);
    const updateSql = `
      UPDATE appointments
      SET status = 'cancelled by business'
      WHERE id IN (${ids.map(() => "?").join(",")})
    `;

    db.query(updateSql, ids, async (err) => {
      if (err)
        return res.status(500).json({ error: "Failed to cancel appointments" });

      // Send email to each customer
      for (const appt of appointments) {
        const msg = {
          to: appt.email,
          subject: "Appointment Cancelled - Business Closed",
          text: `Dear ${appt.customer_name},

Your appointment on ${appt.date} at ${appt.time} for '${appt.service_name}' has been cancelled because the business will be closed that day.

We apologize for the inconvenience.

Scissors & Co.`,
        };

        try {
          await transporter.sendMail({
            ...msg,
            from: "scissorsco2025@gmail.com",
          });
        } catch (e) {
          console.error("❌ Failed to send email to", appt.email, e);
        }
      }

      res.json({ cancelled: appointments.length });
    });
  });
});
app.delete("/api/special-hours/cancel-appointments", (req, res) => {
  const { date, reason } = req.body;

  const fetchSql = `
    SELECT a.id, u.email, u.name, s.name AS service_name, a.time
    FROM appointments a
    JOIN users u ON a.customer_id = u.id
    JOIN services s ON a.service_id = s.id
    WHERE a.date = ? AND a.status NOT LIKE 'cancelled%'
  `;

  db.query(fetchSql, [date], (err, results) => {
    if (err) return res.status(500).json({ error: "Fetch error" });

    const updateSql = `
      UPDATE appointments 
      SET status = 'cancelled by business' 
      WHERE date = ? AND status NOT LIKE 'cancelled%'
    `;

    db.query(updateSql, [date], (err2) => {
      if (err2) return res.status(500).json({ error: "Update error" });

      results.forEach(({ email, name, service_name, time }) => {
        const mailOptions = {
          from: "Scissors&Co <scissorsco2025@gmail.com>",
          to: email,
          subject: "Appointment Cancellation Notice – Scissors & Co.",
          text: `Dear ${name},\n\nWe regret to inform you that your appointment for "${service_name}" on ${date} at ${time} has been cancelled due to:\n\n"${reason}".\n\nWe apologize for the inconvenience and invite you to rebook at your convenience.\n\nWarm regards,\nScissors & Co.`,
        };

        transporter.sendMail(mailOptions, (err3) => {
          if (err3) console.error("❌ Email send failed:", err3);
        });
      });

      res.json({ message: "Appointments updated and customers notified." });
    });
  });
});
app.put("/api/appointments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "pending",
    "done",
    "no show",
    "cancelled by customer",
    "cancelled by business",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const result = await db.execute(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    res.json({ message: "Status updated." });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error." });
  }
});
// GET /api/users?role=Admin
app.get("/api/users", (req, res) => {
  const { role } = req.query;
  let query = "SELECT id, name, phone FROM users";
  const params = [];

  if (role) {
    query += " WHERE role = ?";
    params.push(role);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
// 1. Send reset code
app.post("/api/password-reset/send-code", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  emailVerifications[email] = { code, expiresAt };

  const mailOptions = {
    from: "Scissors&Co <scissorsco2025@gmail.com>",
    to: email,
    subject: "Password Reset Code – Scissors & Co.",
    text: `Your password reset code is: ${code}`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.status(500).json({ error: "Failed to send email" });
    res.json({ message: "Reset code sent to email" });
  });
});

// 2. Verify reset code
app.post("/api/password-reset/verify-code", (req, res) => {
  const { email, code } = req.body;
  const record = emailVerifications[email];
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  emailVerifications[email].resetVerified = true;
  res.json({ message: "Code verified" });
});

// 3. Update password
app.post("/api/password-reset/update", (req, res) => {
  const { email, newPassword } = req.body;
  const record = emailVerifications[email];
  if (!record || !record.resetVerified) {
    return res.status(403).json({ error: "Email not verified for reset" });
  }

  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Hashing failed" });

    const sql = "UPDATE users SET password = ? WHERE email = ?";
    db.query(sql, [hash, email], (err2, result) => {
      if (err2) return res.status(500).json({ error: "Update failed" });

      delete emailVerifications[email];

      const mailOptions = {
        from: "Scissors&Co <scissorsco2025@gmail.com>",
        to: email,
        subject: "Password Updated – Scissors & Co.",
        text: `Hello,\n\nYour password was successfully updated.\n\nIf you did not make this change, please contact support immediately.\n\n— Scissors & Co.`,
      };

      transporter.sendMail(mailOptions, (err3) => {
        if (err3) console.error("Failed to send confirmation email:", err3);
      });

      res.json({ message: "Password updated successfully" });
    });
  });
});

//get current vat
app.get("/api/vat/current", (req, res) => {
  const sql = `
    SELECT percentage FROM vat
    WHERE start_date <= CURDATE()
    ORDER BY start_date DESC
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results[0]);
  });
});

//change vat
app.post("/api/vat", (req, res) => {
  const { percentage, start_date } = req.body;

  if (!percentage || !start_date) {
    return res.status(400).json({ error: "Missing percentage or start date" });
  }

  const sql = "INSERT INTO vat (percentage, start_date) VALUES (?, ?)";
  db.query(sql, [percentage, start_date], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Insert failed", details: err });
    res
      .status(201)
      .json({ message: "VAT added successfully", id: result.insertId });
  });
});

//get vat for specif date
app.get("/api/vat/by-date", (req, res) => {
  const { date } = req.query;

  if (!date) return res.status(400).json({ error: "Missing date" });

  const sql = `
    SELECT percentage FROM vat
    WHERE start_date <= ?
    ORDER BY start_date DESC
    LIMIT 1
  `;

  db.query(sql, [date], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results[0]);
  });
});

app.get("/api/customers/summary-range", (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Missing date range" });
  }

  const sql = `
    SELECT 
      u.id, u.name, u.email, u.role,
      a.date, a.time, s.name AS service, s.price, a.status
    FROM users u
    JOIN appointments a ON u.id = a.customer_id
    JOIN services s ON a.service_id = s.id
    WHERE a.date BETWEEN ? AND ?
    ORDER BY u.id, a.date DESC
  `;

  db.query(sql, [start, end], (err, results) => {
    if (err) {
      console.error("❌ DB error in /customers/summary-range:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    const map = {};
    results.forEach((row) => {
      if (!map[row.id]) {
        map[row.id] = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          appointments: [],
        };
      }

      map[row.id].appointments.push({
        date: row.date,
        time: row.time,
        service: row.service,
        price: row.price,
        status: row.status, // ✅ Include status so frontend can check it
      });
    });

    res.json(Object.values(map));
  });
});

app.get("/api/customers/all", (req, res) => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE role = 'Customer'
  `;
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});

// ✅ Get sick leaves needing proof for current month
app.get("/api/holidays/pending-proof/:employeeId", (req, res) => {
  const { employeeId } = req.params;

  const sql = `
    SELECT id, start_date, end_date, submitted_at
    FROM holidays
    WHERE employee_id = ?
      AND reason = 'Sick'
      AND proof_file IS NULL
      AND updated_to_time_off = 0
      AND MONTH(submitted_at) = MONTH(CURDATE())
      AND YEAR(submitted_at) = YEAR(CURDATE())
  `;

  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch pending sick proofs:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/holidays/pending-review", (req, res) => {
  const sql = `
    SELECT h.id, h.start_date, h.end_date, h.employee_id, h.proof_file, u.name AS employee_name
    FROM holidays h
    JOIN users u ON h.employee_id = u.id
    WHERE h.reason = 'Sick' AND h.proof_file IS NOT NULL AND h.proof_status IS NULL
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch pending sick proof reviews:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

app.put("/api/holidays/:id/review", (req, res) => {
  const { id } = req.params;
  const { decision, comment } = req.body;

  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision" });
  }

  const sql = `
    UPDATE holidays
    SET proof_status = ?, proof_comment = ?, reviewed_at = NOW()
    WHERE id = ?
  `;

  db.query(sql, [decision, comment || null, id], (err, result) => {
    if (err) {
      console.error("❌ Failed to update sick note review:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      message: `Sick note ${decision}`,
      affected: result.affectedRows,
    });
  });
});




app.put("/api/appointments/:id/cancel", (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.body; // sent from frontend

  const statusMap = {
    customer: "cancelled by customer",
    employee_self: "cancelled by customer",
    employee_customer: "cancelled by business",
    admin_self: "cancelled by customer",
    admin_other: "cancelled by business",
  };

  // Step 1: Get appointment data
  const getQuery = `
    SELECT a.*, 
           c.email AS customer_email, c.name AS customer_name,
           e.email AS employee_email, e.name AS employee_name,
           s.name AS service_name
    FROM appointments a
    JOIN users c ON a.customer_id = c.id
    JOIN users e ON a.employee_id = e.id
    JOIN services s ON a.service_id = s.id
    WHERE a.id = ?
  `;

  db.query(getQuery, [id], (err, results) => {
    if (err || results.length === 0)
      return res.status(400).json({ error: "Appointment not found" });

    const appt = results[0];

    // Step 2: Determine who is cancelling and which status to apply
    let statusKey = "";
    if (role === "Customer" && appt.customer_id == userId) {
      statusKey = "customer";
    } else if (role === "Employee") {
      if (appt.employee_id == userId && appt.customer_id == userId) {
        statusKey = "employee_self"; // Employee booked himself
      } else if (appt.employee_id == userId) {
        statusKey = "employee_customer";
      }
    } else if (role === "Admin") {
      if (appt.customer_id == userId && appt.employee_id == userId) {
        statusKey = "admin_self";
      } else {
        statusKey = "admin_other";
      }
    }

    if (!statusKey)
      return res.status(403).json({ error: "Unauthorized action" });

    const newStatus = statusMap[statusKey];

    // Step 3: Update appointment status
    const updateQuery = `UPDATE appointments SET status = ? WHERE id = ? AND status = 'pending'`;
    db.query(updateQuery, [newStatus, id], (err2, result2) => {
      if (err2 || result2.affectedRows === 0)
        return res
          .status(500)
          .json({ error: "Failed to cancel or already cancelled" });

      // Step 4: Send emails
      // Step 4: Send customized emails
      const {
        customer_email,
        customer_name,
        employee_email,
        employee_name,
        date,
        time,
        service_name,
      } = appt;

      const formattedDate = new Date(date).toLocaleDateString("en-GB");
      const formattedTime = time.slice(0, 5);

      // 1. Define email content per case
      let customerSubject = "";
      let customerText = "";
      let employeeSubject = "";
      let employeeText = "";

      // Who cancelled what?
      if (statusKey === "customer") {
        // Customer cancelled their own
        customerSubject = "Appointment Cancelled";
        customerText = `
Hello ${customer_name},

The appointment you booked with ${employee_name} for ${service_name} on ${formattedDate} at ${formattedTime} has been cancelled successfully.

– Scissors & Co.
  `.trim();

        employeeSubject = "Customer Appointment Cancelled";
        employeeText = `
Hello ${employee_name},

Customer ${customer_name} has cancelled their appointment for ${service_name} on ${formattedDate} at ${formattedTime}.

– Scissors & Co.
  `.trim();
      } else if (statusKey === "employee_self" || statusKey === "admin_self") {
        // Employee or Admin cancelled their own appointment
        const name = role === "Admin" ? "Admin" : "Employee";
        const userName = role === "Admin" ? customer_name : employee_name;

        customerSubject = "Appointment Cancelled";
        customerText = `
Hello ${userName},

The appointment you booked for ${service_name} on ${formattedDate} at ${formattedTime} was cancelled successfully.

– Scissors & Co.
  `.trim();

        // No need to email anyone else
      } else if (
        statusKey === "employee_customer" ||
        statusKey === "admin_other"
      ) {
        // Business (admin or employee) cancels customer appointment
        customerSubject = "Your Appointment was Cancelled";
        customerText = `
Hello ${customer_name},

Your appointment on ${formattedDate} at ${formattedTime} for ${service_name} has been cancelled by the business.

You can book a new appointment anytime through the platform.

– Scissors & Co.
  `.trim();

        employeeSubject = "Customer Appointment Cancelled";
        employeeText = `
Hello ${employee_name},

Customer ${customer_name}’s appointment on ${formattedDate} at ${formattedTime} for ${service_name} has been cancelled by the business.

– Scissors & Co.
  `.trim();
      }

      // 2. Send Emails
      if (customerSubject && customerText) {
        transporter.sendMail(
          {
            from: '"Scissors & Co." <scissorsco2025@gmail.com>',
            to: customer_email,
            subject: customerSubject,
            text: customerText,
          },
          (err) => {
            if (err) console.warn("Failed to email customer:", err);
          }
        );
      }

      if (employeeSubject && employeeText) {
        transporter.sendMail(
          {
            from: '"Scissors & Co." <scissorsco2025@gmail.com>',
            to: employee_email,
            subject: employeeSubject,
            text: employeeText,
          },
          (err) => {
            if (err) console.warn("Failed to email employee:", err);
          }
        );
      }

      res.json({
        message: "Appointment cancelled and notifications sent.",
      });
    });
  });
});

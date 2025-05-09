const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const authRoutes = require("./routes/auth");

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
  const { name, price, time, category_id } = req.body;
  if (!name || !price || !time || !category_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql =
    "INSERT INTO services (name, price, time, category_id) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, price, time, category_id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json({ message: "Service added successfully", id: result.insertId });
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

// ✅ NEW: Get all services
app.get("/api/services", (req, res) => {
  const sql = "SELECT id, name, price FROM services";
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});

// ✅ NEW: Get all employees
app.get("/api/employees", (req, res) => {
  const sql = "SELECT id, name FROM users WHERE role = 'Employee'";
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
});

// ✅ Update service
app.put("/services/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, time } = req.body;

  const sql = "UPDATE services SET name = ?, price = ?, time = ? WHERE id = ?";
  const values = [name, price, time, id];
  db.query(sql, values, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service updated successfully" });
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
  const sql = "SELECT id, name, email FROM users WHERE role = 'Customer'";
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

  if (!["Employee", "Customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const sql = "UPDATE users SET role = ? WHERE id = ?";
  db.query(sql, [role, id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json({ message: `User role updated to ${role}` });
  });
});

// ✅ Available times based on employee schedule and booked appointments
// app.get("/api/available-times", (req, res) => {
//   const { employeeId, date } = req.query;

//   if (!employeeId || !date) {
//     return res.status(400).json({ error: "Missing employeeId or date" });
//   }

//   // Define working hours
//   const startHour = 9;
//   const endHour = 17;
//   const slotDuration = 30; // minutes

//   const allSlots = [];
//   for (let h = startHour; h < endHour; h++) {
//     allSlots.push(`${h.toString().padStart(2, "0")}:00`);
//     allSlots.push(`${h.toString().padStart(2, "0")}:30`);
//   }

//   const sql = `
//     SELECT time FROM appointments
//     WHERE employee_id = ? AND date = ?
//   `;

//   db.query(sql, [employeeId, date], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: "Database error", details: err });
//     }

//     const bookedTimes = results.map((r) => r.time);
//     const available = allSlots.filter((slot) => !bookedTimes.includes(slot));

//     res.json(available);
//   });
// });

// ✅ Smart available-times endpoint with service duration + debug logs
app.get("/api/available-times", (req, res) => {
  const { employeeId, date, serviceId } = req.query;

  if (!employeeId || !date || !serviceId) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  const slotInterval = 15;
  const openingTime = "10:00";
  const closingTime = "16:00";

  const fallbackDuration = 30; // fallback if duration not found

  // Step 1: Get service duration
  const durationQuery = "SELECT time FROM services WHERE id = ?";
  db.query(durationQuery, [serviceId], (err, durationResults) => {
    if (err || durationResults.length === 0) {
      return res
        .status(500)
        .json({ error: "Could not fetch service duration" });
    }

    const serviceDuration = durationResults[0].time || fallbackDuration;

    // Step 2: Get employee's existing appointments
    const appointmentQuery = `
      SELECT time, s.time AS serviceDuration
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.employee_id = ? AND a.date = ?
    `;
    db.query(appointmentQuery, [employeeId, date], (err2, results) => {
      if (err2) {
        return res.status(500).json({ error: "Database error", details: err2 });
      }

      // Create time ranges in minutes
      const booked = results.map((appt) => {
        const [h, m] = appt.time.split(":").map(Number);
        const start = h * 60 + m;
        const end = start + appt.serviceDuration;
        return { start, end };
      });

      // Step 3: Generate slots
      const [openH, openM] = openingTime.split(":").map(Number);
      const [closeH, closeM] = closingTime.split(":").map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

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

      res.json(available);
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
  const { view, start, end, employeeId } = req.query;

  let sql = `
    SELECT 
      a.id,
      DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
      DATE_FORMAT(a.time, '%H:%i') AS time,
      a.status,
      c.name AS customer_name,
      e.name AS employee_name,
      s.name AS service_name,
      s.price
    FROM appointments a
    JOIN users c ON a.customer_id = c.id
    JOIN users e ON a.employee_id = e.id
    JOIN services s ON a.service_id = s.id
    WHERE 1 = 1
  `;

  const params = [];

  if (view === "day") {
    sql += " AND a.date = CURDATE()";
  } else if (view === "week") {
    sql += " AND a.date BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE()";
  } else if (view === "year") {
    sql += " AND YEAR(a.date) = YEAR(CURDATE())";
  }

  if (start && end) {
    sql += " AND a.date BETWEEN ? AND ?";
    params.push(start, end);
  }

  // ✅ Only filter by employee if it's provided
  if (employeeId) {
    sql += " AND a.employee_id = ?";
    params.push(employeeId);
  }

  sql += " ORDER BY a.date DESC, a.time DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching appointments:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    res.json(results);
  });
});

// ✅ Check if employee has any appointments before demotion
app.get("/api/employees/:id/appointments", (req, res) => {
  const { id } = req.params;

  const sql =
    "SELECT COUNT(*) AS count FROM appointments WHERE employee_id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error checking employee appointments:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const hasAppointments = results[0].count > 0;
    res.json({ hasAppointments });
  });
});

app.put("/api/users/:id/profile", (req, res) => {
  const { id } = req.params;
  const { name, oldPassword, newPassword } = req.body;

  const getUserSql = "SELECT password FROM users WHERE id = ?";
  db.query(getUserSql, [id], (err, results) => {
    if (err || results.length === 0)
      return res.status(500).json({ error: "User not found" });

    const user = results[0];

    const updateName = () => {
      db.query("UPDATE users SET name = ? WHERE id = ?", [name, id], (err) => {
        if (err)
          return res.status(500).json({ error: "Failed to update name" });
        res.json({ message: "Profile updated" });
      });
    };

    if (!newPassword) {
      updateName(); // just update name
    } else {
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
              res.json({ message: "Profile and password updated" });
            }
          );
        });
      });
    }
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

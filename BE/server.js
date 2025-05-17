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

app.get("/api/available-times", (req, res) => {
  const { date, employeeId, serviceId } = req.query;

  console.log("📥 Request Params:", { date, employeeId, serviceId });

  if (!date || !employeeId || !serviceId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Get the weekday name
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
    console.log(
      "⏱️ Service Duration (parsed):",
      serviceDuration,
      typeof serviceDuration
    );

    // Step 2: Get working hours
    const hoursQuery = `
      SELECT start_time, end_time FROM working_hours
      WHERE day_of_week = ?
      LIMIT 1
    `;

    db.query(hoursQuery, [dayOfWeek], (err2, hoursResult) => {
      if (err2 || hoursResult.length === 0) {
        console.error("❌ Error fetching working hours:", err2);
        return res.status(400).json({ error: "No working hours found" });
      }

      const workingHours = {
        start_time: hoursResult[0].start_time,
        end_time: hoursResult[0].end_time,
      };

      console.log("🕒 Working Hours:", workingHours);

      const [startH, startM] = workingHours.start_time
        .substring(0, 5)
        .split(":")
        .map(Number);
      const [endH, endM] = workingHours.end_time
        .substring(0, 5)
        .split(":")
        .map(Number);
      const openMinutes = startH * 60 + startM;
      const closeMinutes = endH * 60 + endM;

      // Step 3: Fetch appointments
      const apptQuery = `
        SELECT a.time AS appointmentTime, s.time AS serviceDuration
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.employee_id = ? AND a.date = ?
      `;

      db.query(apptQuery, [employeeId, date], (err3, appts) => {
        if (err3) {
          console.error("❌ Error fetching appointments:", err3);
          return res.status(500).json({
            error: "Failed to fetch appointments",
            details: err3,
          });
        }

        const booked = appts.map(({ appointmentTime, serviceDuration }) => {
          const [h, m] = appointmentTime.split(":").map(Number);
          const start = h * 60 + m;
          const end = start + Number(serviceDuration); // ✅ Ensure it's numeric
          return { start, end };
        });

        console.log("📅 Booked:", booked);

        // Step 4: Generate available slots
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

// app.get("/api/debug/slots", (req, res) => {
//   const date = req.query.date || new Date().toISOString().split("T")[0];
//   const employeeId = req.query.employeeId || 6;
//   const serviceId = req.query.serviceId || 1;

//   const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
//     weekday: "long",
//   });

//   console.log("🌞 Day:", dayOfWeek);

//   const debug = { step: "start", date, dayOfWeek };

//   const fallbackDuration = 30;
//   const slotInterval = 15;

//   const durationQuery = "SELECT time FROM services WHERE id = ?";
//   db.query(durationQuery, [serviceId], (err, result) => {
//     if (err || result.length === 0) {
//       return res.status(500).json({ error: "No service duration" });
//     }

//     const serviceDuration = result[0].time || fallbackDuration;
//     debug.serviceDuration = serviceDuration;

//     const hoursQuery = `
//       SELECT start_time, end_time FROM working_hours
//       WHERE employee_id IS NULL AND day_of_week = ?
//       LIMIT 1
//     `;
//     db.query(hoursQuery, [dayOfWeek], (err2, hoursResult) => {
//       if (err2 || hoursResult.length === 0) {
//         return res.status(400).json({ error: "No working hours" });
//       }

//       const start_time = hoursResult[0].start_time.substring(0, 5);
//       const end_time = hoursResult[0].end_time.substring(0, 5);
//       debug.start_time = start_time;
//       debug.end_time = end_time;

//       const [openH, openM] = start_time.split(":").map(Number);
//       const [closeH, closeM] = end_time.split(":").map(Number);
//       const openMinutes = openH * 60 + openM;
//       const closeMinutes = closeH * 60 + closeM;

//       debug.openMinutes = openMinutes;
//       debug.closeMinutes = closeMinutes;

//       const apptQuery = `
//         SELECT time, s.time AS serviceDuration
//         FROM appointments a
//         JOIN services s ON a.service_id = s.id
//         WHERE a.employee_id = ? AND a.date = ?
//       `;

//       db.query(apptQuery, [employeeId, date], (err3, appts) => {
//         if (err3) {
//           return res.status(500).json({ error: "Appointments error" });
//         }

//         const booked = appts.map((appt) => {
//           const [h, m] = appt.time.split(":").map(Number);
//           const start = h * 60 + m;
//           const end = start + appt.serviceDuration;
//           return { start, end };
//         });

//         debug.booked = booked;

//         const available = [];

//         for (
//           let t = openMinutes;
//           t + serviceDuration <= closeMinutes;
//           t += slotInterval
//         ) {
//           const end = t + serviceDuration;

//           const overlaps = booked.some(
//             (b) => Math.max(t, b.start) < Math.min(end, b.end)
//           );

//           if (!overlaps) {
//             const hour = String(Math.floor(t / 60)).padStart(2, "0");
//             const minute = String(t % 60).padStart(2, "0");
//             available.push(`${hour}:${minute}`);
//           }
//         }

//         debug.available = available;
//         res.json(debug);
//       });
//     });
//   });
// });

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
// app.get("/api/available-times", (req, res) => {
//   const { employeeId, date, serviceId } = req.query;

//   if (!employeeId || !date || !serviceId) {
//     return res.status(400).json({ error: "Missing required query parameters" });
//   }

//   const slotInterval = 15;
//   const openingTime = "10:00";
//   const closingTime = "16:00";

//   const fallbackDuration = 30; // fallback if duration not found

//   // Step 1: Get service duration
//   const durationQuery = "SELECT time FROM services WHERE id = ?";
//   db.query(durationQuery, [serviceId], (err, durationResults) => {
//     if (err || durationResults.length === 0) {
//       return res
//         .status(500)
//         .json({ error: "Could not fetch service duration" });
//     }

//     const serviceDuration = durationResults[0].time || fallbackDuration;

//     // Step 2: Get employee's existing appointments
//     const appointmentQuery = `
//       SELECT time, s.time AS serviceDuration
//       FROM appointments a
//       JOIN services s ON a.service_id = s.id
//       WHERE a.employee_id = ? AND a.date = ?
//     `;
//     db.query(appointmentQuery, [employeeId, date], (err2, results) => {
//       if (err2) {
//         return res.status(500).json({ error: "Database error", details: err2 });
//       }

//       // Create time ranges in minutes
//       const booked = results.map((appt) => {
//         const [h, m] = appt.time.split(":").map(Number);
//         const start = h * 60 + m;
//         const end = start + appt.serviceDuration;
//         return { start, end };
//       });

//       // Step 3: Generate slots
//       const [openH, openM] = openingTime.split(":").map(Number);
//       const [closeH, closeM] = closingTime.split(":").map(Number);
//       const openMinutes = openH * 60 + openM;
//       const closeMinutes = closeH * 60 + closeM;

//       const available = [];

//       for (
//         let t = openMinutes;
//         t + serviceDuration <= closeMinutes;
//         t += slotInterval
//       ) {
//         const end = t + serviceDuration;

//         const overlaps = booked.some(
//           (b) => Math.max(t, b.start) < Math.min(end, b.end)
//         );

//         if (!overlaps) {
//           const hour = String(Math.floor(t / 60)).padStart(2, "0");
//           const minute = String(t % 60).padStart(2, "0");
//           available.push(`${hour}:${minute}`);
//         }
//       }

//       res.json(available);
//     });
//   });
// });
app.post("/api/business-hours", (req, res) => {
  const hours = req.body; // Array of 7 entries

  const sql = `
    INSERT INTO working_hours (day_of_week, start_time, end_time)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
    start_time = VALUES(start_time),
    end_time = VALUES(end_time)
  `;

  let completed = 0;
  let hasError = false;

  hours.forEach(({ day_of_week, start_time, end_time }) => {
    db.query(sql, [day_of_week, start_time, end_time], (err) => {
      if (err && !hasError) {
        console.error("❌ Error updating business hour:", err);
        hasError = true;
        return res.status(500).json({ error: "Database error" });
      }

      completed++;
      if (completed === hours.length && !hasError) {
        res.json({ message: "Business hours saved." });
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
    WHERE employee_id IS NULL
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

app.post("/api/business-hours", (req, res) => {
  const hours = req.body; // Array of 7 entries

  const sql = `
    INSERT INTO working_hours (employee_id, day_of_week, start_time, end_time)
    VALUES (NULL, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    start_time = VALUES(start_time),
    end_time = VALUES(end_time)
  `;

  let completed = 0;
  let hasError = false;

  hours.forEach(({ day_of_week, start_time, end_time }) => {
    db.query(sql, [day_of_week, start_time, end_time], (err) => {
      if (err && !hasError) {
        console.error("❌ Error updating business hour:", err);
        hasError = true;
        return res.status(500).json({ error: "Database error" });
      }

      completed++;
      if (completed === hours.length && !hasError) {
        res.json({ message: "Business hours saved." });
      }
    });
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


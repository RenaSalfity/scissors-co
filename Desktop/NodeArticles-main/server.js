const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const authRoutes = require("./routes/auth");

const PORT = process.env.PORT || 5001; // ✅ Change port if needed

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // ✅ Serve static files
//app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Change if needed
  password: "", // Your MySQL password
  database: "scissors&co.",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to the database");
});

// ✅ Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});
const upload = multer({ storage });
// ✅ FIX: Login Route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = results[0];

    // ✅ Check password using bcrypt
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: "Server error" });

      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // ✅ Send user data (excluding password)
      res.json({ id: user.id, email: user.email, role: user.role });
    });
  });
});

// ✅ FIX: Define POST route for categories
app.post("/categories", upload.single("image"), (req, res) => {
  const { name } = req.body;
  const image = req.file ? req.file.filename : null; // ✅ Check if image exists

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

// ✅ FIX: GET categories (Check if this route exists!)
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
app.put("/services/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, time } = req.body;

  console.log("Incoming update request:", { id, name, price, time });

  const sql = "UPDATE services SET name = ?, price = ?, time = ? WHERE id = ?";
  const values = [name, price, time, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating service:", err);
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service updated successfully" });
  });
});
app.delete("/services/:id", (req, res) => {
  const { id } = req.params;

  console.log("Incoming delete request for service ID:", id);

  const sql = "DELETE FROM services WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting service:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service deleted successfully" });
  });
});

// ✅ FIX: DELETE category
app.delete("/categories/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM categories WHERE id = ?", [id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json({ message: "Category deleted successfully" });
  });
});
// ✅ Update a Category (Name & Image)
app.put("/categories/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.file ? req.file.filename : null; // ✅ Get new image if uploaded

  // ✅ Update logic: If there's a new image, update both name & image
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

// ✅ Start Server after defining routes
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

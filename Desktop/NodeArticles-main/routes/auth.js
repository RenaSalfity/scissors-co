const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../dbSingleton").getConnection();

const router = express.Router();

// ✅ Enhanced Password Validation Function
const isValidPassword = (password) => {
  return (
    /[a-zA-Z]/.test(password) && // At least one letter
    /\d/.test(password) && // At least one digit
    password.length >= 3 && // Minimum length
    password.length <= 8 // Maximum length
  );
};

// ✅ Signup Route
router.post("/signup", async (req, res) => {
  const { name, phone, email, password } = req.body;

  // ✅ Validate user input
  if (!/^[A-Za-z]{2,}$/.test(name)) {
    return res
      .status(400)
      .json({
        error: "Name must contain at least 2 letters and only letters.",
      });
  }

  if (!/^05\d{8}$/.test(phone)) {
    return res
      .status(400)
      .json({
        error: "Phone number must be exactly 10 digits and start with '05'.",
      });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json({
        error:
          "Password must be 3-8 characters long and contain at least one letter and one number.",
      });
  }

  try {
    // ✅ Check if the user already exists
    const checkUserQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Internal server error. Please try again later." });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "User already exists." });
      }

      // ✅ Hash the password before inserting into the database
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Insert the new user with role "Customer"
      const insertUserQuery =
        "INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, 'Customer')";
      db.query(
        insertUserQuery,
        [name, phone, email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({
                error: "Internal server error. Please try again later.",
              });
          }

          res
            .status(201)
            .json({ message: "Signup successful! Please log in." });
        }
      );
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // ✅ Validate email format (no password format check)
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // ✅ Find user by email
    const checkUserQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Internal server error. Please try again later." });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: "User not found." });
      }

      const user = results[0];

      // ✅ Compare entered password with hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Password is incorrect." }); // ✅ No format check
      }

      // ✅ Login successful
      res
        .status(200)
        .json({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});



module.exports = router;

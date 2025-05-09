const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("Login request:", { email, password }); // Log the request

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err); // Log database errors
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      console.log("User not found:", email); // Log if user is not found
      return res.status(401).json({ error: "User not found" });
    }

    const user = results[0];
    console.log("User found:", user); // Log the user data

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("Bcrypt error:", err); // Log bcrypt errors
        return res.status(500).json({ error: "Server error" });
      }

      if (!isMatch) {
        console.log("Incorrect password for:", email); // Log incorrect password
        return res.status(401).json({ error: "Incorrect password" });
      }

      console.log("Login successful for:", email); // Log successful login
      res.json({ id: user.id, email: user.email, role: user.role });
    });
  });
});

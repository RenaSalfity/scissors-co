const bcrypt = require("bcrypt");

// Hashed password from your database
const storedHash =
  "$2b$10$XnUPuXQwqzXlUjrlYc4OFOMwr6OlIqkMqD9Kga0BXZkQCrOeO1H12";

// The password you are entering
const userPassword = "password123";

bcrypt.compare(userPassword, storedHash, (err, isMatch) => {
  if (err) console.error("Bcrypt error:", err);
  else console.log("Password Match:", isMatch);
});

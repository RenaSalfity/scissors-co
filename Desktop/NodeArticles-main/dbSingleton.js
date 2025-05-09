const mysql = require("mysql2");

let connection;

const db = {
  getConnection: () => {
    if (!connection) {
      connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "scissors&co.", // ✅ Updated database name
      });

      connection.connect((err) => {
        if (err) {
          console.error("Error connecting to database:", err);
          throw err;
        }
        console.log("Connected to MySQL!");
      });

      connection.on("error", (err) => {
        console.error("Database connection error:", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          connection = null;
        }
      });
    }
    return connection;
  },
};

module.exports = db;

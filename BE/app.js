const express = require("express");
const cors = require("cors");
const app = express();

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/products");
const articleRoutes = require("./routes/articles");
const PORT = process.env.PORT || 5001; // ✅ Change port if needed


app.use(express.json());
app.use(cors());

app.use("/users", userRoutes);
app.use("/prods", productRoutes);
app.use("/post", articleRoutes);
app.use((err, req, res, next) => {
  console.error(err); // Log error
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

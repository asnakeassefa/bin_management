import express, { json } from "express";
const app = express();
import authRoutes from "./app/routes/auth_routes.js";
import binRoutes from "./app/routes/bin_routes.js";
app.use(json()); // to handle JSON body

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bins", binRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

import express, { json } from "express";
import { errorResponse, notFoundResponse } from "./app/utils/responseHandler.js";
import authRoutes from "./app/routes/auth_routes.js";
import binRoutes from "./app/routes/bin_routes.js";
import countryRoutes from "./app/routes/country_routes.js";
import userRoutes from './app/routes/user_routes.js';
import config from './app/config/config.js';
import './app/cron/collection_cron.js';

const app = express();

// Middleware
app.use(json());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bins", binRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/countries", countryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    return errorResponse(res, err.message || 'Something went wrong', err.statusCode || 500);
});

// 404 handler
app.use((req, res) => {
    return notFoundResponse(res);
});

// Start server
app.listen(config.server.port, () => {
    console.log(`Server is running in ${config.server.env} mode on port ${config.server.port}`);
});

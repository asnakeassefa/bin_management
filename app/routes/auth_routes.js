import { Router } from "express";
import { 
    register, 
    login, 
    forgotPassword, 
    resetPassword,
    refreshToken,
    logout,
} from "../controllers/auth_controller.js";
import { validateBody } from "../middleware/validate.js";
import { authSchemas } from "../validations/schemas.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/login", validateBody(authSchemas.login), login);
router.post("/register", validateBody(authSchemas.register), register);
router.post("/refresh-token", validateBody(authSchemas.refreshToken), refreshToken);
router.post("/forgot-password", validateBody(authSchemas.forgotPassword), forgotPassword);
router.post("/reset-password", validateBody(authSchemas.resetPassword), resetPassword);

export default router;
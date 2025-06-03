import express from 'express';
import { userController } from '../controllers/user_controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { validateBody } from '../middleware/validate.js';
import { userSchemas } from '../validations/schemas.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Admin user management routes
router.post('/', validateBody(userSchemas.createUser), userController.createUser);
router.get('/', userController.getUsers);
router.patch('/:userId', validateBody(userSchemas.updateUser), userController.updateUser);
router.delete('/:userId', userController.deleteUser);

export default router; 
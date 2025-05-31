import express from 'express';
import { 
  addUserBin,
  updateBinSchedule,
  updateBinAppearance,
  getUserBins,
  getUpcomingCollections
} from '../controllers/bin_controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/addUserBin', authenticateToken, addUserBin);
router.put('/:id/schedule', authenticateToken, updateBinSchedule);
router.put('/:id/appearance', authenticateToken, updateBinAppearance);
router.get('/getuserBin', authenticateToken, getUserBins);
router.get('/upcoming', authenticateToken, getUpcomingCollections);

export default router;
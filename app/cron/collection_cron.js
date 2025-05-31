import cron from 'node-cron';
import { checkUpcomingCollections } from '../services/notification_service.js';

// Run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Checking for upcoming bin collections...');
  await checkUpcomingCollections();
});
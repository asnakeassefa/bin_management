import cron from 'node-cron';
import { checkUpcomingCollections } from '../services/notification_service.js';

// Run daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Checking for upcoming bin collections...');
  await checkUpcomingCollections();
});

// Run daily at 6 PM
cron.schedule('0 20 * * *', async () => {
  console.log('Checking for upcoming bin collections...');
  await checkUpcomingCollections();
});

// Run every minutes for testing purposes
cron.schedule('* * * * *', async () => {
  console.log('Checking for upcoming bin collections (every minute for testing)...');
  await checkUpcomingCollections();
});
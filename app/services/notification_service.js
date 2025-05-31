import { UserBin, User } from '../models/index.js';
import { Op } from 'sequelize';
import { addDays, addHours, format, isSameDay, isAfter, isBefore, setHours, setMinutes } from 'date-fns';
import nodemailer from 'nodemailer';
import { messaging } from '../config/firebase.js';

// Helper function to check if current time is around 6 PM or 6 AM
function isNotificationTime() {
  const now = new Date();
  const sixPM = setHours(setMinutes(now, 0), 18); // 6:00 PM
  const sixAM = setHours(setMinutes(now, 0), 6);  // 6:00 AM
  
  // Check if current time is within 5 minutes of 6 PM or 6 AM
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return (
    (Math.abs(now - sixPM) <= fiveMinutes) || // Around 6 PM
    (Math.abs(now - sixAM) <= fiveMinutes)    // Around 6 AM
  );
}

// Helper function to check if a bin needs notification
function shouldNotifyBin(bin) {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const nextCollectionDate = new Date(bin.nextCollectionDate);
  
  // Check if collection is tomorrow
  const isCollectionTomorrow = isSameDay(nextCollectionDate, tomorrow);
  
  // Get the last notification time for this bin
  const lastNotification = bin.lastNotificationTime;
  
  if (!isCollectionTomorrow) return false;
  
  // If no previous notification, notify at 6 PM
  if (!lastNotification) {
    return isNotificationTime() && isAfter(now, setHours(setMinutes(now, 0), 12)); // After 12 PM
  }
  
  // If already notified at 6 PM, notify again at 6 AM next day
  const lastNotificationDate = new Date(lastNotification);
  const isLastNotificationPM = lastNotificationDate.getHours() >= 18;
  
  if (isLastNotificationPM) {
    return isNotificationTime() && isBefore(now, setHours(setMinutes(now, 0), 12)); // Before 12 PM
  }
  
  return false;
}

export async function checkUpcomingCollections() {
  try {
    // Only run if it's notification time (6 PM or 6 AM)
    if (!isNotificationTime()) {
      return;
    }

    const tomorrow = addDays(new Date(), 1);
    
    // Find bins that need notification
    const binsToNotify = await UserBin.findAll({
      where: {
        notificationEnabled: true,
        nextCollectionDate: {
          [Op.between]: [tomorrow, addDays(tomorrow, 1)]
        }
      },
      include: [{
        model: User,
        attributes: ['email', 'name', 'deviceToken']
      }]
    });

    // Filter bins that need notification based on timing
    const binsToNotifyNow = binsToNotify.filter(shouldNotifyBin);

    // Send notifications
    for (const bin of binsToNotifyNow) {
      if (bin.User.deviceToken) {
        await sendPushNotification(bin);
        
        // Update last notification time
        await bin.update({
          lastNotificationTime: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error checking collections:', error);
  }
}

async function sendPushNotification(bin) {
  const { User: user } = bin;
  const now = new Date();
  const isMorning = now.getHours() < 12;
  
  // Prepare notification message based on time of day
  const timeOfDay = isMorning ? 'morning' : 'evening';
  const title = `Bin Collection Reminder`;
  const body = isMorning 
    ? `Final reminder: Your ${bin.binType} bin will be collected today!`
    : `Your ${bin.binType} bin will be collected tomorrow.`;

  // Prepare the notification payload
  const message = {
    token: user.deviceToken,
    notification: {
      title: title,
      body: body
    },
    data: {
      binType: bin.binType,
      bodyColor: bin.bodyColor,
      headColor: bin.headColor,
      collectionDate: bin.nextCollectionDate.toISOString(),
      type: 'collection_reminder'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'bin_collections',
        sound: 'default',
        priority: 'high',
        importance: 'high',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  try {
    // Send the notification
    const response = await messaging.send(message);
    console.log('Successfully sent notification:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If the token is invalid, remove it from the user
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      await user.update({ deviceToken: null });
      console.log('Removed invalid device token for user:', user.id);
    }
  }
} 
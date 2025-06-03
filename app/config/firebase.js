import admin from 'firebase-admin';
import config from './config.js';

// Initialize Firebase Admin if Firebase config is provided
if (config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail
        })
    });
}

export const messaging = admin.messaging(); 
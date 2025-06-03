import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateEnvFile() {
    console.log('Setting up environment variables...\n');

    // Generate a secure random string for JWT secret
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    // Generate a secure random string for admin token
    const adminToken = crypto.randomBytes(16).toString('hex');

    // Default values
    const envVars = {
        PORT: '3000',
        NODE_ENV: 'development',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'bin_db',
        DB_USER: 'postgres',
        DB_PASSWORD: '',
        JWT_SECRET: jwtSecret,
        JWT_ACCESS_EXPIRY: '1h',
        JWT_REFRESH_EXPIRY: '7d',
        ADMIN_REGISTRATION_TOKEN: adminToken,
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: '',
        SMTP_PASS: '',
        EMAIL_FROM: '',
        FIREBASE_PROJECT_ID: '',
        FIREBASE_PRIVATE_KEY: '',
        FIREBASE_CLIENT_EMAIL: '',
        LOG_LEVEL: 'debug',
        LOG_FILE_PATH: 'logs/app.log'
    };

    // Ask for database password
    envVars.DB_PASSWORD = await question('Enter database password (default: postgres): ') || 'postgres';

    // Ask for email configuration
    const useEmail = await question('Do you want to configure email settings? (y/n): ');
    if (useEmail.toLowerCase() === 'y') {
        envVars.SMTP_USER = await question('Enter SMTP email address: ');
        envVars.SMTP_PASS = await question('Enter SMTP password/app-specific password: ');
        envVars.EMAIL_FROM = envVars.SMTP_USER;
    }

    // Ask for Firebase configuration
    const useFirebase = await question('Do you want to configure Firebase for push notifications? (y/n): ');
    if (useFirebase.toLowerCase() === 'y') {
        envVars.FIREBASE_PROJECT_ID = await question('Enter Firebase project ID: ');
        envVars.FIREBASE_PRIVATE_KEY = await question('Enter Firebase private key: ');
        envVars.FIREBASE_CLIENT_EMAIL = await question('Enter Firebase client email: ');
    }

    // Generate .env file content
    const envContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    // Write to .env file
    const envPath = path.join(__dirname, '../.env');
    fs.writeFileSync(envPath, envContent);

    console.log('\nEnvironment variables have been set up successfully!');
    console.log('Important: Please keep your .env file secure and never commit it to version control.');
    console.log('\nGenerated secure tokens:');
    console.log(`JWT Secret: ${jwtSecret}`);
    console.log(`Admin Registration Token: ${adminToken}`);
    console.log('\nMake sure to save these tokens securely!');

    rl.close();
}

generateEnvFile().catch(console.error); 
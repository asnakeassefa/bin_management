import db from './app/models/index.js';

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');

    // First, drop all tables
    console.log('Dropping all tables...');
    await db.sequelize.drop();
    console.log('All tables dropped successfully');

    // Then recreate the tables with the new schema
    console.log('Recreating tables with new schema...');
    await db.sequelize.sync({ force: true });
    console.log('Tables recreated successfully');

    console.log('Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanDatabase();
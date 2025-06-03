import db from './app/models/index.js';
import { UK_COUNTRIES } from './app/validations/country_schemas.js';

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Test database connection first
    try {
      await db.sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      process.exit(1);
    }

    // Drop all tables using a simpler approach
    console.log('Dropping all tables...');
    await db.sequelize.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables in the public schema
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('Dropped all tables');

    // Recreate tables with new schema
    console.log('Recreating tables with new schema...');
    await db.sequelize.sync({ force: true });
    console.log('Recreated tables with new schema');

    // Seed UK countries
    console.log('Seeding UK countries...');
    for (const [code, name] of Object.entries(UK_COUNTRIES)) {
      try {
        await db.Country.create({
          code,
          name,
          isActive: true
        });
        console.log(`Created country: ${name} (${code})`);
      } catch (error) {
        console.error(`Error creating country ${code}:`, error.message);
      }
    }
    console.log('Finished seeding UK countries!');

    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    // Close database connection
    try {
      await db.sequelize.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
    process.exit(0);
  }
}

// Run the cleanup function
cleanDatabase();
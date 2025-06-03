import { Country } from '../app/models/index.js';
import { UK_COUNTRIES } from '../app/validations/country_schemas.js';

async function seedCountries() {
  try {
    console.log('Starting to seed UK countries...');

    // Create each UK country
    for (const [code, name] of Object.entries(UK_COUNTRIES)) {
      try {
        // Try to find existing country
        const [country, created] = await Country.findOrCreate({
          where: { code },
          defaults: {
            name,
            isActive: true
          }
        });

        if (created) {
          console.log(`Created country: ${name} (${code})`);
        } else {
          console.log(`Country already exists: ${name} (${code})`);
        }
      } catch (error) {
        console.error(`Error creating country ${code}:`, error.message);
      }
    }

    console.log('Finished seeding UK countries!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding countries:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedCountries(); 
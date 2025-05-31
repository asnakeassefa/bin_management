// Create a file: initialize-bins.js
import { BinType } from './app/models/index.js';

async function initializeBins() {
  try {
    const binTypes = await BinType.bulkCreate([
      {
        name: 'recycle',
        defaultInterval: 14,
        description: 'For recyclable materials like paper, plastic, glass, and metal'
      },
      {
        name: 'garden',
        defaultInterval: 28,
        description: 'For garden waste like grass clippings, leaves, and small branches'
      },
      {
        name: 'general',
        defaultInterval: 7,
        description: 'For general household waste that cannot be recycled'
      }
    ], {
      ignoreDuplicates: true
    });

    console.log('Bin types initialized:', binTypes.map(bin => bin.name));
  } catch (error) {
    console.error('Error:', error);
  }
}

initializeBins();
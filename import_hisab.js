const { MongoClient } = require('mongodb');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables manually from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const mongoUrl = envFile.match(/MONGO_URL=(.*)/)[1].trim();
const dbName = envFile.match(/DB_NAME=(.*)/)[1].trim();

const USER_ID = "69941b24dd225af3d55776ee";
const SPACE_ID = "69941b24dd225af3d55776ee";

const records = [
  // October 2023
  { date: '2024-10-18', name: 'Jagamama', mobile: '9725450038', type: 'credit', amount: 5000, description: '' },
  ];

async function importRecords() {
  let client;
  try {
    client = await MongoClient.connect(mongoUrl);
    const db = client.db(dbName);
    const collection = db.collection('hisab');

    console.log(`Connected to database: ${dbName}`);
    console.log(`Importing ${records.length} records...`);

    const formattedRecords = records.map(r => {
      // Fix for possible invalid date format '2025-18-12' to '2025-12-18'
      let dateStr = r.date;
      if (dateStr === '2025-18-12') dateStr = '2025-12-18';
      
      return {
        hisab_id: `hsb_${uuidv4().split('-')[0]}`,
        user_id: USER_ID,
        space_id: SPACE_ID,
        name: r.name,
        mobile: r.mobile || '',
        type: r.type,
        amount: parseFloat(r.amount),
        description: r.description,
        date: new Date(dateStr),
        created_at: new Date(),
      };
    });

    const result = await collection.insertMany(formattedRecords);
    console.log(`Successfully inserted ${result.insertedCount} records.`);

  } catch (error) {
    console.error('Error importing records:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

importRecords();

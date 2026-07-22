const { MongoClient } = require('mongodb');

// This script should be run in production to create necessary MongoDB indexes.
// It resolves PERF-01 from the Pre-Production Audit.
// Run with: node scripts/init-indexes.js

const uri = process.env.MONGO_URL;
if (!uri) {
  console.error('MONGO_URL environment variable is required.');
  process.exit(1);
}

const dbName = process.env.DB_NAME || 'hisab_db';

async function initIndexes() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(`Connected to MongoDB at ${uri.split('@')[1] || uri}`);
    const db = client.db(dbName);

    console.log('Creating indexes for `expenses` collection...');
    await db.collection('expenses').createIndex({ space_id: 1, date: -1 });
    await db.collection('expenses').createIndex({ space_id: 1, associatedId: 1 });

    console.log('Creating indexes for `hisab` collection...');
    await db.collection('hisab').createIndex({ space_id: 1, date: -1 });

    console.log('Creating indexes for `marriage_hisab` collection...');
    await db.collection('marriage_hisab').createIndex({ space_id: 1, date: -1 });

    console.log('Creating indexes for `settings` collection...');
    await db.collection('settings').createIndex({ space_id: 1 }, { unique: true });

    console.log('Creating indexes for `users` collection...');
    await db.collection('users').createIndex({ space_id: 1 });

    console.log('Creating indexes for `collaboration_requests` collection...');
    await db.collection('collaboration_requests').createIndex({ to_email: 1, status: 1 });

    console.log('Successfully created all required indexes!');
  } catch (err) {
    console.error('Error creating indexes:', err);
  } finally {
    await client.close();
  }
}

initIndexes();

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
    await db.collection('expenses').createIndex({ space_id: 1, date: -1, createdAt: -1 });
    await db.collection('expenses').createIndex({ space_id: 1, associatedId: 1 });
    await db.collection('expenses').createIndex({ space_id: 1, type: 1, date: -1 }); // Optimizes getMonthlySummary


    console.log('Creating indexes for `hisab` collection...');
    await db.collection('hisab').createIndex({ space_id: 1, date: -1, created_at: -1 });
    await db.collection('hisab').createIndex({ space_id: 1, ignored: 1, date: -1, created_at: -1 }); // Optimizes getDashboardStats

    console.log('Creating indexes for `marriage_hisab` collection...');
    await db.collection('marriage_hisab').createIndex({ space_id: 1, date: -1 });

    console.log('Creating indexes for `settings` collection...');
    await db.collection('settings').createIndex({ space_id: 1 }, { unique: true });

    console.log('Creating indexes for `users` collection...');
    await db.collection('users').createIndex({ space_id: 1 });

    console.log('Creating indexes for `collaboration_requests` collection...');
    await db.collection('collaboration_requests').createIndex({ to_email: 1, status: 1 });
    await db.collection('collaboration_requests').createIndex({ space_id: 1 });
    await db.collection('collaboration_requests').createIndex({ from_user_id: 1, status: 1 });

    console.log('Creating indexes for `insurance_policies` collection...');
    await db.collection('insurance_policies').createIndex({ space_id: 1, nextDueDate: 1 });

    console.log('Creating indexes for `warranties` collection...');
    await db.collection('warranties').createIndex({ space_id: 1, expiryDate: 1 });

    console.log('Creating indexes for `push_subscriptions` collection...');
    await db.collection('push_subscriptions').createIndex({ user_id: 1 });

    console.log('Creating indexes for `recurring_expenses` collection...');
    await db.collection('recurring_expenses').createIndex({ space_id: 1, isActive: 1 });

    console.log('Creating indexes for `vault_reminders` collection...');
    await db.collection('vault_reminders').createIndex({ space_id: 1, nextDueDate: 1 });
    await db.collection('vault_reminders').createIndex({ space_id: 1, expiryDate: 1 });

    console.log('Creating indexes for `password_entries` collection...');
    await db.collection('password_entries').createIndex({ user_id: 1, updated_at: -1 });
    await db.collection('password_entries').createIndex({ space_id: 1 });
    await db.collection('password_entries').createIndex({ user_id: 1, password_hash: 1 });

    console.log('Successfully created all required indexes!');
  } catch (err) {
    console.error('Error creating indexes:', err);
  } finally {
    await client.close();
  }
}

initIndexes();

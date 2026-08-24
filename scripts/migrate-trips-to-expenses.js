const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load .env.local if present
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const uri = process.env.MONGO_URL;
if (!uri) {
  console.error('MONGO_URL environment variable is required.');
  process.exit(1);
}

const dbName = process.env.DB_NAME || 'hisab_db';

async function migrate() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(`Connected to MongoDB database: ${dbName}`);
    const db = client.db(dbName);

    // 1. Find all expenses with associatedType: 'trip'
    const tripExpenses = await db.collection('expenses').find({
      $or: [
        { associatedType: 'trip' },
        { tripMetadata: { $exists: true } }
      ]
    }).toArray();

    console.log(`Found ${tripExpenses.length} trip-associated expense records.`);

    if (tripExpenses.length > 0) {
      let updatedCount = 0;
      for (const exp of tripExpenses) {
        // Determine best category
        let finalCategory = exp.category;
        if (!finalCategory || finalCategory === 'Uncategorized' || finalCategory === 'General & Other') {
          if (exp.tripMetadata && exp.tripMetadata.tripCategory) {
            finalCategory = exp.tripMetadata.tripCategory;
          }
        }

        await db.collection('expenses').updateOne(
          { _id: exp._id },
          {
            $unset: {
              associatedType: "",
              associatedId: "",
              tripMetadata: ""
            },
            $set: {
              category: finalCategory || 'General & Other',
              updatedAt: new Date()
            }
          }
        );
        updatedCount++;
      }
      console.log(`Successfully migrated ${updatedCount} trip expenses to standard expenses.`);
    }

    // 2. Check trips collection
    const collections = await db.listCollections({ name: 'trips' }).toArray();
    if (collections.length > 0) {
      const tripsCount = await db.collection('trips').countDocuments();
      console.log(`Found ${tripsCount} documents in 'trips' collection.`);
      await db.collection('trips').drop();
      console.log(`Successfully dropped 'trips' collection.`);
    } else {
      console.log(`'trips' collection does not exist or already dropped.`);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrate();

import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error('Please define the MONGO_URL environment variable inside .env.local');
}

if (!dbName) {
  throw new Error('Please define the DB_NAME environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri as string, {
    maxPoolSize: 10,
    minPoolSize: 5,
  });

  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

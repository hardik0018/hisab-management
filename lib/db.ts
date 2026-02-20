
import { Db, MongoClient } from 'mongodb';
import clientPromise from './mongodb-promise';

const dbName = process.env.DB_NAME;

if (!dbName) {
  throw new Error('Please define the DB_NAME environment variable inside .env.local');
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db(dbName);
  return { client, db };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

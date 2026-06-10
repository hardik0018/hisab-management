import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  }
}

async function main() {
  const { getDb } = await import('../lib/db');
  const db = await getDb();

  console.log('--- CURRENT LIC EXPENSES ---');
  const expenses = await db.collection('expenses').find({ itemName: { $regex: 'Lic', $options: 'i' } }).toArray();
  console.log(JSON.stringify(expenses, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

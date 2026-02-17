import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb-promise';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Ensure the user document has the 'user_id' field expected by the rest of the app
      const { v4: uuidv4 } = require('uuid');
      const userId = `user_${uuidv4().split('-')[0]}`;
      
      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME || 'hisab_db');
      await db.collection('users').updateOne(
        { _id: user.id },
        { $set: { user_id: userId } }
      );
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev',
};

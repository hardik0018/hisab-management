import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb-promise"
import { v4 as uuidv4 } from 'uuid'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
       clientId: process.env.GOOGLE_CLIENT_ID,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       allowDangerousEmailAccountLinking: true,
    })
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
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
  secret: process.env.NEXTAUTH_SECRET,
})

import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb-promise"
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from 'mongodb'

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      user_id: string;
      space_id: string;
    } & DefaultSession["user"]
  }

  interface User {
    user_id?: string;
    space_id?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
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
        // user_id and space_id are fetched in lib/auth.ts for server components/actions
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
        { _id: new ObjectId(user.id) },
        { $set: { user_id: userId } }
      );
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

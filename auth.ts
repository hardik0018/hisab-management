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
       authorization: {
         params: {
           scope: "openid profile email https://www.googleapis.com/auth/gmail.readonly",
           access_type: "offline",
           prompt: "consent",
         },
       },
    })
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google" && user.id) {
        console.log('[AUTH_SIGNIN] Google signin details:', {
          hasRefreshToken: !!account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope
        });

        // Manually update the tokens in database as NextAuth database strategy 
        // doesn't always update 'accounts' on subsequent logins.
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'hisab_db');
        
        await db.collection('accounts').updateOne(
          { userId: new ObjectId(user.id), provider: "google" },
          { 
            $set: { 
              access_token: account.access_token,
              expires_at: account.expires_at,
              refresh_token: account.refresh_token || undefined,
              scope: account.scope,
              id_token: account.id_token
            } 
          },
          { upsert: false } // We only want to update if it exists
        );
        console.log('[AUTH_SIGNIN] Database tokens updated manually');
      }
      return true;
    },
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

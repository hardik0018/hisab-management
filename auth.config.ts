import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [], 
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      
      const isPublicRoute = 
        path === '/' || 
        path === '/login' || 
        path === '/privacy' || 
        path === '/terms' ||
        path.startsWith('/api/');
      
      if (isPublicRoute) {
        if (isLoggedIn && path === '/login') {
          return Response.redirect(new URL('/expenses', nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

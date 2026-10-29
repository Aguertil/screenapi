import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sendWelcomeEmail } from './email';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async signIn({ user, account }) {
      // Auto-create free subscription and API key for OAuth users
      if (account?.provider === 'google' || account?.provider === 'github') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { subscriptions: true, apiKeys: true },
        });

        if (existingUser && existingUser.subscriptions.length === 0) {
          // Create FREE subscription
          await prisma.subscription.create({
            data: {
              userId: existingUser.id,
              plan: 'FREE',
              status: 'ACTIVE',
              creditsTotal: 100,
              creditsUsed: 0,
              creditsRemaining: 100,
            },
          });

          // Create API key
          const crypto = await import('crypto');
          const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
          
          await prisma.apiKey.create({
            data: {
              userId: existingUser.id,
              key: apiKey,
              name: 'Default API Key',
              isActive: true,
              rateLimit: 10,
            },
          });

          // Send welcome email for new OAuth users
          sendWelcomeEmail(user.email!, user.name || 'User').catch((err) =>
            console.error('Failed to send welcome email:', err)
          );
        }
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Create FREE subscription for new users
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          creditsTotal: 100,
          creditsUsed: 0,
          creditsRemaining: 100,
        },
      });

      // Create default API key
      const crypto = await import('crypto');
      const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
      
      await prisma.apiKey.create({
        data: {
          userId: user.id,
          key: apiKey,
          name: 'Default API Key',
          isActive: true,
          rateLimit: 10,
        },
      });
    },
  },
};

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

const secureCookies=process.env.AUTH_COOKIE_SECURE==='true'||process.env.NEXTAUTH_URL?.startsWith('https:')===true

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            technician: true
          }
        })

        if (!user || !user.isActive) {
          throw new Error('Invalid email or password')
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in')
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          technicianId: user.technician?.id,
          companyId: user.companyId
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth sign-in
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        if (!user.email) return false

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { technician: true }
        })

        if (existingUser?.isActive && existingUser.emailVerified) {
          // User exists, update the token with their info
          user.id = existingUser.id
          user.role = existingUser.role
          user.technicianId = existingUser.technician?.id
          user.companyId = existingUser.companyId
          return true
        }

        // Tenant/role assignment is an administrative provisioning action.
        // Never create a company or privileged user from an OAuth assertion.
        return false
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.technicianId = user.technicianId
        token.companyId = user.companyId
      }

      // For OAuth, fetch fresh user data on each JWT creation
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          include: { technician: true }
        })
        if (dbUser) {
          token.sub = dbUser.id
          token.role = dbUser.role
          token.technicianId = dbUser.technician?.id
          token.companyId = dbUser.companyId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.technicianId = token.technicianId as string | undefined
        session.user.companyId = token.companyId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Cookie configuration for HTTPS behind proxy
  cookies: {
    sessionToken: {
      name: secureCookies ? '__Secure-homeservices.session-token' : 'homeservices.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
      },
    },
    callbackUrl: {
      name: secureCookies ? '__Secure-homeservices.callback-url' : 'homeservices.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
      },
    },
    csrfToken: {
      name: secureCookies ? '__Host-homeservices.csrf-token' : 'homeservices.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
      },
    },
    pkceCodeVerifier: {
      name: secureCookies ? '__Secure-homeservices.pkce.code_verifier' : 'homeservices.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
        maxAge: 900,
      },
    },
    state: {
      name: secureCookies ? '__Secure-homeservices.state' : 'homeservices.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
        maxAge: 900,
      },
    },
  },
}

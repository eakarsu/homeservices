import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { compare, hash } from 'bcryptjs'
import { prisma } from './prisma'
import { seedDemoDataForCompany } from './seedDemoData'

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

        if (existingUser) {
          // User exists, update the token with their info
          user.id = existingUser.id
          user.role = existingUser.role
          user.technicianId = existingUser.technician?.id
          user.companyId = existingUser.companyId
          return true
        }

        // Create new user with company
        const nameParts = (user.name || '').split(' ')
        const firstName = nameParts[0] || 'User'
        const lastName = nameParts.slice(1).join(' ') || ''

        const result = await prisma.$transaction(async (tx) => {
          // Create company
          const company = await tx.company.create({
            data: {
              name: `${firstName}'s Company`,
              email: user.email!,
              phone: '',
              address: '',
              city: '',
              state: '',
              zip: '',
            }
          })

          // Create user with random password (they'll use OAuth)
          const randomPassword = await hash(Math.random().toString(36), 10)
          const newUser = await tx.user.create({
            data: {
              email: user.email!,
              password: randomPassword,
              firstName,
              lastName,
              role: 'ADMIN',
              companyId: company.id,
              isActive: true,
            }
          })

          return { company, user: newUser }
        })

        // Seed demo data for the new company
        try {
          await prisma.$transaction(async (tx) => {
            await seedDemoDataForCompany(tx, result.company.id, result.user.id)
          })
        } catch (error) {
          console.error('Error seeding demo data:', error)
        }

        // Update the user object with new user info
        user.id = result.user.id
        user.role = result.user.role
        user.companyId = result.company.id
        return true
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
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.pkce.code_verifier' : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.state' : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
  },
}

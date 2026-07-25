import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        // Compare against a dummy hash when the user is missing so that a bad
        // email and a bad password take the same amount of time.
        const hash = user?.password ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
        const valid = await bcrypt.compare(credentials.password, hash)

        if (!user || !valid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { staff, client_users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password

        // 1. Check staff table first
        const [staffUser] = await db
          .select({
            id: staff.id,
            full_name: staff.full_name,
            email: staff.email,
            password_hash: staff.password_hash,
            role: staff.role,
          })
          .from(staff)
          .where(eq(staff.email, email))

        if (staffUser && staffUser.password_hash) {
          const isValid = await bcrypt.compare(password, staffUser.password_hash)
          if (isValid) {
            return {
              id: staffUser.id,
              name: staffUser.full_name,
              email: staffUser.email,
              role: staffUser.role,
              userType: "staff",
            }
          }
          return null
        }

        // 2. Check client_users table
        const [clientUser] = await db
          .select({
            id: client_users.id,
            client_id: client_users.client_id,
            full_name: client_users.full_name,
            email: client_users.email,
            password_hash: client_users.password_hash,
          })
          .from(client_users)
          .where(eq(client_users.email, email))

        if (clientUser && clientUser.password_hash) {
          const isValid = await bcrypt.compare(password, clientUser.password_hash)
          if (isValid) {
            return {
              id: clientUser.id,
              name: clientUser.full_name,
              email: clientUser.email,
              role: "client",
              userType: "client",
              clientId: clientUser.client_id,
            }
          }
          return null
        }

        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.userType = user.userType
        token.clientId = user.clientId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.userType = token.userType
        session.user.clientId = token.clientId
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs to stay relative
      if (url.startsWith("/")) return url
      try {
        const parsedUrl = new URL(url)
        // Allow same origin or same host (e.g. running on port 3001 or other ports on localhost)
        if (parsedUrl.origin === baseUrl) return url
        if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") {
          return url
        }
      } catch {}
      return baseUrl
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

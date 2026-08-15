import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

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
        const staffRes = await pool.query(
          "SELECT id, full_name, email, password_hash, role FROM staff WHERE LOWER(email) = $1",
          [email]
        )

        if (staffRes.rows.length > 0) {
          const staffUser = staffRes.rows[0]
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
        const clientRes = await pool.query(
          "SELECT id, client_id, full_name, email, password_hash FROM client_users WHERE LOWER(email) = $1",
          [email]
        )

        if (clientRes.rows.length > 0) {
          const clientUser = clientRes.rows[0]
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
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

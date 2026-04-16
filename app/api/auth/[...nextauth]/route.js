import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const ALLOWED_EMAILS = [
  "farseen1982@gmail.com",
  "cecilia303@gmail.com",
];

// bcrypt hash of the admin password (cost 12)
const ADMIN_PASSWORD_HASH = "$2b$12$eSwiJGc3agIED6aY2ptfvuUxjmxpeQAesC3h1wXEnKYK.9YzqdpfS";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username !== "Admin") return null;

        const valid = await bcrypt.compare(credentials.password, ADMIN_PASSWORD_HASH);
        if (!valid) return null;

        return { id: "admin", name: "Admin", email: "admin@salesjournal" };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      return ALLOWED_EMAILS.includes(user.email?.toLowerCase());
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };

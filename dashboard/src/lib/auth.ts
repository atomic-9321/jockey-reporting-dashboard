import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET environment variable is required");
  return new TextEncoder().encode(secret);
}

const SESSION_COOKIE = "jockey-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  email: string;
  role: "admin" | "viewer";
  exp: number;
}

function getUsers(): Array<{ email: string; password: string; role: "admin" | "viewer" }> {
  const raw = process.env.AUTH_USERS || "";
  return raw
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const [email, password] = entry.split(":");
      const role = email.startsWith("admin") ? "admin" : "viewer";
      return { email, password, role };
    });
}

export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return { success: false, error: "Invalid credentials" };
  }

  const token = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return { success: true };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

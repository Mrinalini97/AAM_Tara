import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "tara_admin";
const TTL_SECONDS = 60 * 60 * 24 * 7;

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin_manasa",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

function sessionSecret() {
  const { username, password } = getAdminCredentials();
  return process.env.ADMIN_SESSION_SECRET || `${username}:${password}:tara-admin`;
}

function digestEqual(a: string, b: string) {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function verifyAdminCredentials(username: string, password: string) {
  const expected = getAdminCredentials();
  return digestEqual(username.trim(), expected.username) && digestEqual(password, expected.password);
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export async function createAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${getAdminCredentials().username}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete({ name: COOKIE, path: "/" });
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, expRaw, mac] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  if (username !== getAdminCredentials().username) return false;
  const payload = `${username}.${expRaw}`;
  return digestEqual(mac, sign(payload));
}

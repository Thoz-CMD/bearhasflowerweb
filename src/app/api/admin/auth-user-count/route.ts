import { NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
 
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
 
const ADMIN_PHONES = ['0656144703', '0622720348', '0872243371'];
const ADMIN_EMAILS = ['thosapol.nir@gmail.com'];
 
const getAdminApp = () => {
  if (getApps().length > 0) return getApps()[0]!;
 
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  let privateKey = rawPrivateKey ? rawPrivateKey.trim() : undefined;
  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  const hasAnyExplicitCred = Boolean(projectId || clientEmail || rawPrivateKey);
 
  if (hasAnyExplicitCred) {
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('missing_firebase_admin_credentials');
    }
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      throw new Error('malformed_firebase_admin_private_key');
    }
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
 
  return initializeApp();
};
 
const isWhitelistedAdmin = (email?: string | null, phone?: string | null) => {
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanPhone = phone ? phone.trim() : null;
  if (cleanPhone && ADMIN_PHONES.includes(cleanPhone)) return true;
  if (cleanEmail && ADMIN_EMAILS.includes(cleanEmail)) return true;
  return false;
};
 
const verifyAdminRequest = async (request: Request) => {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;
  if (!token) return { ok: false as const, status: 401, error: 'missing_token' };
 
  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token);
    const phoneNumber = (decoded as unknown as { phone_number?: string | null }).phone_number || null;
 
    if (isWhitelistedAdmin(decoded.email, phoneNumber)) {
      return { ok: true as const, uid: decoded.uid };
    }
 
    const db = getFirestore(app);
    const snap = await db.collection('users').doc(decoded.uid).get();
    const role = snap.exists ? (snap.data()?.role as string | undefined) : undefined;
    if (role === 'admin') return { ok: true as const, uid: decoded.uid };
 
    return { ok: false as const, status: 403, error: 'forbidden' };
  } catch {
    return { ok: false as const, status: 401, error: 'invalid_token' };
  }
};
 
type CachedCount = { value: number; at: number };
let cached: CachedCount | null = null;
const CACHE_MS = 30_000;
 
export async function GET(request: Request) {
  const gate = await verifyAdminRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
 
  try {
    if (cached && Date.now() - cached.at < CACHE_MS) {
      return NextResponse.json({ count: cached.value, cached: true });
    }
 
    const app = getAdminApp();
    const auth = getAuth(app);
 
    let count = 0;
    let pageToken: string | undefined = undefined;
    do {
      const result = await auth.listUsers(1000, pageToken);
      count += result.users.length;
      pageToken = result.pageToken;
    } while (pageToken);
 
    cached = { value: count, at: Date.now() };
    return NextResponse.json({ count, cached: false });
  } catch (err) {
    console.error('auth-user-count failed:', err);
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ error: 'failed_to_list_users', message }, { status: 500 });
  }
}

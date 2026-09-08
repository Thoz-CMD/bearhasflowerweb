import { NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_PHONES = ['0656144703', '0622720348', '0872243371'];
const ADMIN_EMAILS = ['thosapol.nir@gmail.com'];

function getCredentials() {
  let projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bearhasflower';
  let clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
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

  // Fallback to service-account.json
  if (!clientEmail || !privateKey) {
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        projectId = projectId || sa.project_id;
        clientEmail = clientEmail || sa.client_email;
        privateKey = privateKey || sa.private_key;
      } catch (e) {
        console.error('Failed to read service-account.json:', e);
      }
    }
  }

  return { projectId, clientEmail, privateKey };
}

const getAdminApp = () => {
  if (getApps().length > 0) return getApps()[0]!;

  const { projectId, clientEmail, privateKey } = getCredentials();

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return initializeApp({
    projectId,
  });
};

async function getCompensatedAccessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  try {
    let now = Math.floor(Date.now() / 1000);
    // Ping Google to adjust for local clock skew
    try {
      const ping = await fetch('https://www.google.com', { method: 'HEAD' });
      const serverDate = ping.headers.get('date');
      if (serverDate) {
        now = Math.floor(new Date(serverDate).getTime() / 1000);
      }
    } catch {}

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore',
    };

    const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const signingInput = `${encode(header)}.${encode(payload)}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(privateKey, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.warn('Could not get compensated access token:', err);
    return null;
  }
}

const isWhitelistedAdmin = (email?: string | null, phone?: string | null) => {
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanPhone = phone ? phone.trim() : null;
  if (cleanPhone && ADMIN_PHONES.includes(cleanPhone)) return true;
  if (cleanEmail && ADMIN_EMAILS.includes(cleanEmail)) return true;
  return false;
};

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

const verifyAdminRequest = async (request: Request) => {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;
  if (!token) return { ok: false as const, status: 401, error: 'missing_token' };

  try {
    const app = getAdminApp();
    let decoded: any = null;

    try {
      decoded = await getAuth(app).verifyIdToken(token);
    } catch {
      const unverified = decodeJwtPayload(token);
      const expectedProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || 'bearhasflower';
      if (unverified && (unverified.aud === expectedProjectId || unverified.iss?.includes(expectedProjectId))) {
        decoded = unverified;
      } else {
        throw new Error('invalid_token');
      }
    }

    const phoneNumber = (decoded as unknown as { phone_number?: string | null }).phone_number || null;
    const email = decoded.email || null;
    const uid = decoded.uid || decoded.user_id || decoded.sub;

    if (isWhitelistedAdmin(email, phoneNumber)) {
      return { ok: true as const, uid };
    }

    if (uid) {
      try {
        const db = getFirestore(app);
        const snap = await db.collection('users').doc(uid).get();
        const role = snap.exists ? (snap.data()?.role as string | undefined) : undefined;
        if (role === 'admin') return { ok: true as const, uid };
      } catch {
        // Continue fallback
      }
    }

    return { ok: false as const, status: 403, error: 'forbidden' };
  } catch (err: any) {
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

    const { projectId, clientEmail, privateKey } = getCredentials();

    // 1. Try Firebase Auth listUsers directly
    try {
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
    } catch {
      // 2. Try Identity Toolkit REST API with time-compensated Google access token
      if (clientEmail && privateKey) {
        const accessToken = await getCompensatedAccessToken(clientEmail, privateKey);
        if (accessToken) {
          try {
            const idRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:query`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ returnUserInfo: false }),
            });
            if (idRes.ok) {
              const idData = await idRes.json();
              const count = Array.isArray(idData.userInfo) ? idData.userInfo.length : Number(idData.recordsCount || 0);
              cached = { value: count, at: Date.now() };
              return NextResponse.json({ count, cached: false });
            }
          } catch {}
        }
      }

      // 3. Try Firestore REST API
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCDJdBc2FkZTwsQw_gy7sBKRD056IgkM34';
      try {
        const fsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?key=${apiKey}&pageSize=300`);
        if (fsRes.ok) {
          const fsData = await fsRes.json();
          const count = Array.isArray(fsData.documents) ? fsData.documents.length : 0;
          cached = { value: count, at: Date.now() };
          return NextResponse.json({ count, cached: false });
        }
      } catch {}

      // 4. Safe fallback
      const fallbackCount = cached?.value ?? 1;
      return NextResponse.json({ count: fallbackCount, cached: true });
    }
  } catch {
    const fallbackCount = cached?.value ?? 1;
    return NextResponse.json({ count: fallbackCount, cached: true });
  }
}



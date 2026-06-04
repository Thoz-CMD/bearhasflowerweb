import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const maxDuration = 60;

// Generate a JWT token from service account credentials
async function getAccessToken(): Promise<string> {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!;
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/devstorage.full_control',
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Sign with RS256
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey, 'base64url');

  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token as string;
}

export async function POST(req: Request) {
  try {
    const { base64File, path } = await req.json();

    if (!base64File || !path) {
      return NextResponse.json({ error: 'Missing base64File or path' }, { status: 400 });
    }

    // Extract content type and base64 data
    const matches = base64File.match(/^data:(.+);base64,(.+)$/);
    let buffer: Buffer;
    let contentType = 'image/jpeg';

    if (matches && matches.length === 3) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64File, 'base64');
    }

    const bucketName = 'bearhasflower.firebasestorage.app';
    const downloadToken = crypto.randomUUID();

    // Get access token
    const accessToken = await getAccessToken();

    // Upload via Firebase Storage REST API
    const encodedPath = encodeURIComponent(path);
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodedPath}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
      },
      body: buffer.buffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(JSON.stringify(err));
    }

    // Set the download token metadata so Firebase Storage URLs work
    const metaUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodedPath}`;
    await fetch(metaUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      }),
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ success: true, url });

  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
  let projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  let privateKey = rawKey ? rawKey.trim() : undefined;

  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // If credentials are incomplete in env, try loading from service-account.json
  if (!clientEmail || !privateKey) {
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const sa = JSON.parse(fileContent);
        projectId = projectId || sa.project_id;
        clientEmail = clientEmail || sa.client_email;
        privateKey = privateKey || sa.private_key;
      } catch (e) {
        console.error('Failed to parse local service-account.json:', e);
      }
    }
  }

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId || 'bearhasflower',
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bearhasflower.firebasestorage.app',
    });
  } else {
    admin.initializeApp({
      projectId: projectId || 'bearhasflower',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bearhasflower.firebasestorage.app',
    });
  }
}

export const adminStorage = admin.storage();
export const adminDb = admin.firestore();


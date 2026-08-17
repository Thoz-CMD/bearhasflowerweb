import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

type ExpenseItem = {
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  isThaiPlus: boolean;
};

// Spreadsheet ID - ควรเก็บใน environment variable ใน production
const SPREADSHEET_ID = '1uw_2QEarlsYnLu1qGM3MRywURJAG3zOF_kBRLJCFN1k';

function parseCredentials(raw: string) {
  if (!raw) return null;
  let str = raw.trim();

  // Remove surrounding quotes if any
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    str = str.slice(1, -1).trim();
  }

  // Handle base64 encoded JSON
  if (!str.startsWith('{') && !str.startsWith('[')) {
    try {
      const decoded = Buffer.from(str, 'base64').toString('utf-8').trim();
      if (decoded.startsWith('{')) {
        str = decoded;
      }
    } catch (e) {}
  }

  let credentials: any = null;

  // 1. Standard JSON parse
  try {
    credentials = JSON.parse(str);
  } catch (e) {}

  // 2. Fix single quotes in JSON string
  if (!credentials) {
    try {
      const formatted = str
        .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (match, p1) => '"' + p1.replace(/"/g, '\\"') + '"')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      credentials = JSON.parse(formatted);
    } catch (e) {}
  }

  // 3. Safe Function eval fallback for JS object literals
  if (!credentials) {
    try {
      credentials = new Function('return (' + str + ')')();
    } catch (e) {}
  }

  if (credentials && typeof credentials === 'object') {
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    return credentials;
  }

  return null;
}

export async function GET(req: Request) {
  return NextResponse.json({ 
    message: 'Google Sheets Sync API is working. Use POST method to sync data.',
    status: 'ok'
  });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Allow empty or non-JSON body defaults
    }
    const autoSave = body.autoSave === true;

    console.log('Starting Google Sheets sync...');
    console.log('Environment GOOGLE_SERVICE_ACCOUNT_JSON check:', !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    let credentials: any = null;
    
    // Attempt 1: From GOOGLE_SERVICE_ACCOUNT_JSON env var
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      credentials = parseCredentials(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    }

    // Attempt 2: From individual GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY env vars
    if (!credentials && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };
    }

    // Attempt 3: From local service-account.json file
    if (!credentials) {
      try {
        const serviceAccountPath = join(process.cwd(), 'service-account.json');
        const fileContent = readFileSync(serviceAccountPath, 'utf-8');
        credentials = parseCredentials(fileContent);
      } catch (e) {
        console.warn('Local service-account.json not found or invalid:', (e as Error).message);
      }
    }

    if (!credentials || !credentials.client_email || !credentials.private_key) {
      throw new Error('ไม่พบ Google Service Account credentials ที่ถูกต้อง ( client_email หรือ private_key ขาดหายไป )');
    }

    // สร้าง auth client ด้วย GoogleAuth และ credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    // สร้าง sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // ดูข้อมูล spreadsheet ก่อนเพื่อหา sheet name
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    console.log('Spreadsheet sheets:', spreadsheet.data.sheets);

    // หา sheet ที่มีชื่อ "หมีมีดอกไม้" หรือใช้ sheet แรก
    const targetSheet = spreadsheet.data.sheets?.find((sheet: any) => 
      sheet.properties?.title === 'หมีมีดอกไม้'
    ) || spreadsheet.data.sheets?.[0];

    const sheetName = targetSheet?.properties?.title || 'Sheet1';
    console.log('Using sheet:', sheetName);

    // อ่านข้อมูลจาก Google Sheets (FORMATTED_VALUE สำหรับ columns B-F)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:F`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    // อ่านคอลัมน์ A แบบ UNFORMATTED_VALUE เพื่อดึงวันที่เป็น serial number โดยตรง
    // (ไม่ขึ้นกับ locale หรือ format ของ sheet)
    const dateColResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    // อ่าน cell formatting เพื่อตรวจสอบสีพื้นหลัง (สำหรับ Thai+) จาก column A-F
    const formatResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${sheetName}!A:F`],
      fields: 'sheets/data/rowData/values/effectiveFormat/backgroundColor'
    });

    const rows = response.data.values;
    const dateColRaw = dateColResponse.data.values; // raw date values (serial numbers or strings)

    console.log('Google Sheets rows count:', rows?.length);
    console.log('Date column raw (first 15):', dateColRaw?.slice(0, 15));

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลใน Google Sheets' }, { status: 400 });
    }

    // Extract row cell formats
    const rowFormats: any[] = [];
    if (formatResponse.data.sheets && formatResponse.data.sheets[0]?.data?.[0]?.rowData) {
      const rowData = formatResponse.data.sheets[0].data[0].rowData;
      for (const row of rowData) {
        rowFormats.push(row.values || []);
      }
    }

    // ---- ฟังก์ชัน parse วันที่จาก raw value (รองรับ serial number, string d/m/yyyy, ISO) ----
    const parseDateRaw = (rawVal: any): string => {
      if (rawVal === undefined || rawVal === null || rawVal === '') return '';

      // number → Google Sheets serial number (days since Dec 30, 1899)
      if (typeof rawVal === 'number') {
        const ms = (rawVal - 25569) * 86400 * 1000;
        const bkk = new Date(ms + 7 * 3600 * 1000);
        if (isNaN(bkk.getTime())) return '';
        return `${bkk.getUTCFullYear()}-${String(bkk.getUTCMonth()+1).padStart(2,'0')}-${String(bkk.getUTCDate()).padStart(2,'0')}`;
      }

      const s = String(rawVal).trim();
      if (!s) return '';

      // รูปแบบ d/m/yy หรือ d/m/yyyy (ไทย/ยุโรป)
      const mDate = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (mDate) {
        let year = mDate[3];
        if (year.length === 2) year = String(2500 + parseInt(year));
        const yearNum = parseInt(year);
        const ceYear = yearNum > 2500 ? yearNum - 543 : yearNum;
        return `${ceYear}-${mDate[2].padStart(2,'0')}-${mDate[1].padStart(2,'0')}`;
      }

      // numeric string → serial number (เช่น "46383")
      if (/^\d+(\.\d+)?$/.test(s)) {
        const serial = parseFloat(s);
        if (serial > 1000) {
          const ms = (serial - 25569) * 86400 * 1000;
          const bkk = new Date(ms + 7 * 3600 * 1000);
          if (!isNaN(bkk.getTime())) {
            return `${bkk.getUTCFullYear()}-${String(bkk.getUTCMonth()+1).padStart(2,'0')}-${String(bkk.getUTCDate()).padStart(2,'0')}`;
          }
        }
      }

      // ISO / รูปแบบอื่นๆ
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const bkk = new Date(d.getTime() + 7 * 3600 * 1000);
        return `${bkk.getUTCFullYear()}-${String(bkk.getUTCMonth()+1).padStart(2,'0')}-${String(bkk.getUTCDate()).padStart(2,'0')}`;
      }

      return '';
    };

    // วันที่ปัจจุบัน Bangkok timezone (fallback กรณีไม่เจอวันที่เลย)
    const todayBkk = (() => {
      const bkk = new Date(Date.now() + 7 * 3600 * 1000);
      return `${bkk.getUTCFullYear()}-${String(bkk.getUTCMonth()+1).padStart(2,'0')}-${String(bkk.getUTCDate()).padStart(2,'0')}`;
    })();

    // ---- Pass 1: Pre-compute วันที่ของทุกแถว โดย fill-down ----
    // ใช้ข้อมูลจาก dateColRaw (UNFORMATTED_VALUE) ซึ่งส่ง date cells เป็น serial number โดยตรง
    // ไม่ขึ้นกับ locale หรือ format ของ sheet เลย
    const rowDates: string[] = new Array(rows.length).fill('');
    let fillDate = '';
    for (let ri = 0; ri < rows.length; ri++) {
      // ดึงค่าจาก unformatted column A (ให้ serial number สำหรับ date cells)
      const rawUnformatted = dateColRaw?.[ri]?.[0];
      const parsed = parseDateRaw(rawUnformatted);
      console.log(`Pass1 row[${ri}] unformatted="${rawUnformatted}" (${typeof rawUnformatted}) → parsed="${parsed}"`);
      if (parsed) fillDate = parsed;
      rowDates[ri] = fillDate;
    }
    console.log('Pre-computed row dates (first 15):', rowDates.slice(0, 15));


    // ---- Pass 2: Process rows ใช้วันที่จาก rowDates ----
    const items: ExpenseItem[] = [];

    // Skip header row and process data rows - limit to 100 rows to reduce processing time
    const maxRows = Math.min(rows.length, 101); // header + 100 data rows
    for (let i = 1; i < maxRows; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const titleRaw = row[1];
      const incomeRaw = row[2];
      const expenseRaw = row[3];

      // ใช้วันที่จาก pre-computed array (fill-down จากแถวก่อนหน้า)
      const date = rowDates[i] || todayBkk;
      console.log(`Row ${i} (${titleRaw}) → date: ${date} | raw dateCol: ${JSON.stringify(rows[i]?.[0])}`);

      // ตรวจสอบ Thai+ จากสีพื้นหลังของ คอลัมน์ F (Index 5) เท่านั้น
      // ถ้าสีฟ้า = true, ถ้าสีขาว/อื่นๆ = false
      let isThaiPlus = false;
      const colFCellFormat = rowFormats[i]?.[5];
      const colFBgColor = colFCellFormat?.effectiveFormat?.backgroundColor;

      if (colFBgColor) {
        const red = colFBgColor.red ?? 1;
        const green = colFBgColor.green ?? 1;
        const blue = colFBgColor.blue ?? 1;

        // สีฟ้าไฮไลต์ใน Column F มีค่า RGB ประมาณ R=0.23 (60), G=0.47 (120), B=0.85 (216)
        // สีขาว/เทาของ Google Sheets จะมี red >= 0.90
        if (red < 0.5 && blue > 0.7 && blue > green) {
          isThaiPlus = true;
        }
      }

      // Parse amount and type - remove currency symbols and commas
      const cleanAmount = (value: any) => {
        if (!value) return 0;
        const str = String(value).replace(/[฿$,]/g, '').replace(/,/g, '').trim();
        return parseFloat(str) || 0;
      };

      const income = cleanAmount(incomeRaw);
      const expense = cleanAmount(expenseRaw);

      let type: 'income' | 'expense' = 'expense';
      let amount = 0;

      if (income > 0 && expense === 0) {
        type = 'income';
        amount = income;
      } else if (expense > 0 && income === 0) {
        type = 'expense';
        amount = expense;
      } else if (income > 0 && expense > 0) {
        // If both have values, use the larger one
        if (income > expense) {
          type = 'income';
          amount = income;
        } else {
          type = 'expense';
          amount = expense;
        }
      }

      console.log(`Parsed: date=${date}, title=${titleRaw}, income=${income}, expense=${expense}, amount=${amount}, type=${type}, isThaiPlus=${isThaiPlus}`);

      // Skip if no amount
      if (amount === 0) {
        console.log(`Skipping row ${i}: amount is 0`);
        continue;
      }

      // Parse title
      const title = String(titleRaw || 'รายการจาก Google Sheets').trim();

      if (!title) {
        console.log(`Skipping row ${i}: title is empty`);
        continue;
      }

      items.push({
        title,
        amount,
        date, // มาจาก rowDates[i] || todayBkk เสมอ ไม่มีทาง empty
        type,
        isThaiPlus
      });
    }

    console.log(`Total valid items: ${items.length}`);

    if (items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรายการที่ถูกต้องใน Google Sheets' }, { status: 400 });
    }

    // ถ้า autoSave=true ให้ลองบันทึกลง database อัตโนมัติด้วย firebase-admin
    if (autoSave) {
      console.log('Attempting autoSave via firebase-admin...');
      
      const candidateCredentials = [];
      if (credentials?.client_email && credentials?.private_key) {
        candidateCredentials.push({
          name: 'GOOGLE_SERVICE_ACCOUNT_JSON',
          projectId: credentials.project_id || 'bearhasflower',
          clientEmail: credentials.client_email,
          privateKey: credentials.private_key
        });
      }
      
      if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        let pk = process.env.FIREBASE_ADMIN_PRIVATE_KEY.trim();
        if ((pk.startsWith('"') && pk.endsWith('"')) || (pk.startsWith("'") && pk.endsWith("'"))) {
          pk = pk.slice(1, -1);
        }
        pk = pk.replace(/\\n/g, '\n');

        candidateCredentials.push({
          name: 'FIREBASE_ADMIN_* env vars',
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'bearhasflower',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL.trim(),
          privateKey: pk
        });
      }

      let saveSuccess = false;
      let lastSaveError = '';

      for (let idx = 0; idx < candidateCredentials.length; idx++) {
        const cred = candidateCredentials[idx];
        const appName = `auto-save-app-${idx}`;
        try {
          let adminApp;
          const existingApps = getApps();
          const foundApp = existingApps.find(a => a.name === appName);
          if (foundApp) {
            adminApp = foundApp;
          } else {
            adminApp = initializeApp({
              credential: cert({
                projectId: cred.projectId,
                clientEmail: cred.clientEmail,
                privateKey: cred.privateKey
              })
            }, appName);
          }

          const adminDb = getFirestore(adminApp);
          
          // 1. Fetch existing expenses from Firestore for deduplication
          const existingSnap = await adminDb.collection('expenses').limit(500).get();
          const existingSet = new Set<string>();
          
          existingSnap.forEach((docSnap) => {
            const d = docSnap.data();
            const key = `${d.date || ''}|${(d.title || '').trim().toLowerCase()}|${d.amount || 0}|${d.type || ''}|${Boolean(d.isThaiPlus)}`;
            existingSet.add(key);
          });

          // 2. Filter out items that already exist in Firestore
          const newItems = items.filter((item) => {
            const key = `${item.date || ''}|${(item.title || '').trim().toLowerCase()}|${item.amount || 0}|${item.type || ''}|${Boolean(item.isThaiPlus)}`;
            return !existingSet.has(key);
          });

          console.log(`Auto-save deduplication: ${items.length} total items from sheet, ${newItems.length} new items to insert`);

          if (newItems.length === 0) {
            saveSuccess = true;
            return NextResponse.json({ 
              items, 
              count: items.length, 
              newCount: 0,
              autoSaved: true,
              message: `ไม่มีรายการใหม่ต้องบันทึก (รายการใน Google Sheets ทั้งหมด ${items.length} รายการมีในระบบแล้ว)` 
            });
          }

          const batch = adminDb.batch();

          for (const item of newItems) {
            const docRef = adminDb.collection('expenses').doc();
            batch.set(docRef, {
              title: item.title,
              amount: item.amount,
              category: 'other',
              date: item.date,
              type: item.type,
              isThaiPlus: item.isThaiPlus,
              createdAt: FieldValue.serverTimestamp(),
              recordedBy: 'Google Sheets Auto Sync'
            });
          }

          await batch.commit();
          console.log(`Auto-save via firebase-admin (${cred.name}) saved ${newItems.length} new items!`);
          saveSuccess = true;
          return NextResponse.json({ 
            items, 
            count: items.length, 
            newCount: newItems.length,
            autoSaved: true,
            message: `Auto-save สำเร็จ: เพิ่ม ${newItems.length} รายการใหม่ลงเว็บเรียบร้อยแล้ว` 
          });
        } catch (err: any) {
          console.warn(`Auto-save via ${cred.name} failed:`, err?.message);
          lastSaveError = err?.message || 'Permission denied';
        }
      }

      if (!saveSuccess) {
        return NextResponse.json({ 
          items, 
          count: items.length, 
          autoSaved: false,
          message: `อ่านข้อมูลจาก Google Sheets สำเร็จ (${items.length} รายการ)`,
          warning: 'ไม่สามารถบันทึกอัตโนมัติลงฐานข้อมูลได้ เนื่องจากสิทธิ์ Firestore ใน Vercel: ' + lastSaveError 
        });
      }
    }

    return NextResponse.json({ 
      items, 
      count: items.length, 
      autoSaved: false,
      message: `Sync และอ่านข้อมูลจาก Google Sheets สำเร็จเรียบร้อย (${items.length} รายการ)` 
    });
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอ่าน Google Sheets: ' + (err?.message || 'Unknown error') }, { status: 500 });
  }
}

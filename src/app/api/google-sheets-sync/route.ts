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

    // ใช้ sheet แรกเสมอ (dynamic - ไม่สนชื่อ)
    const targetSheet = spreadsheet.data.sheets?.[0];

    const sheetName = targetSheet?.properties?.title || 'Sheet1';
    console.log('Using sheet:', sheetName);

    // อ่านข้อมูลจาก Google Sheets ด้วย UNFORMATTED_VALUE:
    // - date cells ใน column A → serial number (ตัวเลข) = ที่เชื่อถือได้ที่สุด
    // - text cells → string ตามปกติ
    // - number cells (amounts) → number โดยตรง, cleanAmount() รับได้อยู่แล้ว
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:F`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    // อ่าน cell formatting เพื่อตรวจสอบสีพื้นหลัง (สำหรับ Thai+) จาก column A-F
    const formatResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${sheetName}!A:F`],
      fields: 'sheets/data/rowData/values/effectiveFormat/backgroundColor'
    });

    const rows = response.data.values;

    console.log('Google Sheets rows count:', rows?.length);
    console.log('Col A first 15 rows (unformatted):', rows?.slice(0, 15).map((r: any[]) => r?.[0]));

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
    // rows[ri][0] คือ UNFORMATTED date: serial number (number) หรือข้อความที่ไม่ใช่วันที่ (string) หรือว่าง
    const rowDates: string[] = new Array(rows.length).fill('');
    let fillDate = '';
    for (let ri = 0; ri < rows.length; ri++) {
      const rawUnformatted = rows[ri]?.[0]; // ค่า UNFORMATTED จาก request เดียว
      const parsed = parseDateRaw(rawUnformatted);
      console.log(`Pass1 row[${ri}] colA="${rawUnformatted}" (${typeof rawUnformatted}) → parsed="${parsed}"`);
      if (parsed) fillDate = parsed;
      rowDates[ri] = fillDate;
    }
    console.log('Pre-computed row dates (first 15):', rowDates.slice(0, 15));


    // ---- Pass 2: Process ทั้ง Sheet ----
    const items: ExpenseItem[] = [];
    
    console.log(`Processing all rows: rows 1 to ${rows.length - 1} (total ${rows.length} rows in sheet)`);

    for (let i = 1; i < rows.length; i++) {  // i=0 คือ header
      const row = rows[i];
      if (!row || row.length < 2) continue;

      // ✅ Check Column A (index 0) สี - ถ้าสีม่วง ให้ skip
      const colACellFormat = rowFormats[i]?.[0];
      const colABgColor = colACellFormat?.effectiveFormat?.backgroundColor;
      
      let isSkipped = false;
      if (colABgColor) {
        const red = colABgColor.red ?? 1;
        const green = colABgColor.green ?? 1;
        const blue = colABgColor.blue ?? 1;

        console.log(`Row ${i} Column A color: R=${red}, G=${green}, B=${blue}`);

        // สีม่วง: R > 0.6, G < 0.5, B > 0.6
        if (red > 0.6 && green < 0.5 && blue > 0.6) {
          console.log(`✓ Skipping row ${i}: Column A is purple color (skip marker)`);
          isSkipped = true;
        }
      }

      if (isSkipped) continue;

      const titleRaw = row[1];
      const incomeRaw = row[2];
      const expenseRaw = row[3];

      // ใช้วันที่จาก pre-computed array (fill-down จากแถวก่อนหน้าตั้งแต่แถวแรก)
      const date = rowDates[i] || todayBkk;
      console.log(`Row ${i} title="${titleRaw}" income="${incomeRaw}" expense="${expenseRaw}" → date: ${date}`);

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

      // Filter by current month only
      const currentBkk = new Date(Date.now() + 7 * 3600 * 1000);
      const currentYear = currentBkk.getUTCFullYear();
      const currentMonth = String(currentBkk.getUTCMonth() + 1).padStart(2, '0');
      const currentYearMonth = `${currentYear}-${currentMonth}`;
      
      const rowYearMonth = date.substring(0, 7); // "YYYY-MM" from "YYYY-MM-DD"
      
      if (rowYearMonth !== currentYearMonth) {
        console.log(`Skipping row ${i}: date ${date} is not current month (current: ${currentYearMonth})`);
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
          
          // 1. Fetch existing expenses from Firestore matching the dates in items (Date Range Deduplication)
          const uniqueDates = Array.from(new Set(items.map(it => it.date).filter(Boolean)));
          const existingSet = new Set<string>();

          if (uniqueDates.length > 0) {
            // ดึงข้อมูลจาก Firestore เฉพาะช่วงวันที่ที่เจอใน Sheet รอบนี้ (แบ่ง batch ละ 10 วันถ้าจำเป็น)
            for (let dIdx = 0; dIdx < uniqueDates.length; dIdx += 10) {
              const dateBatch = uniqueDates.slice(dIdx, dIdx + 10);
              const dateSnap = await adminDb.collection('expenses')
                .where('date', 'in', dateBatch)
                .get();

              dateSnap.forEach((docSnap) => {
                const d = docSnap.data();
                const key = `${d.date || ''}|${(d.title || '').trim().toLowerCase()}|${d.amount || 0}|${d.type || ''}|${Boolean(d.isThaiPlus)}`;
                existingSet.add(key);
              });
            }
          }

          // 2. Filter out items that already exist in Firestore
          const newItems = items.filter((item) => {
            const key = `${item.date || ''}|${(item.title || '').trim().toLowerCase()}|${item.amount || 0}|${item.type || ''}|${Boolean(item.isThaiPlus)}`;
            return !existingSet.has(key);
          });

          console.log(`Auto-save deduplication: ${items.length} tail items from sheet, ${newItems.length} new items to insert (unique dates: ${uniqueDates.join(', ')})`);

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

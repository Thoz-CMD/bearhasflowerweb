import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

    // อ่านข้อมูลจาก Google Sheets (รวม formatting)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:F`, // อ่าน column A-F ทั้งหมด
    });

    // อ่าน cell formatting เพื่อตรวจสอบสีพื้นหลัง (สำหรับ Thai+)
    const formatResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${sheetName}!F:F`],
      fields: 'sheets/data/rowData/values/effectiveFormat/backgroundColor'
    });

    const rows = response.data.values;

    console.log('Google Sheets rows:', rows);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลใน Google Sheets' }, { status: 400 });
    }

    // Extract background colors from format response
    const backgroundColors: any[] = [];
    if (formatResponse.data.sheets && formatResponse.data.sheets[0]?.data?.[0]?.rowData) {
      const rowData = formatResponse.data.sheets[0].data[0].rowData;
      for (const row of rowData) {
        const bgColor = row.values?.[0]?.effectiveFormat?.backgroundColor;
        backgroundColors.push(bgColor);
      }
    }

    const items: ExpenseItem[] = [];

    // Skip header row and process data rows - limit to 100 rows to reduce processing time
    const maxRows = Math.min(rows.length, 101); // header + 100 data rows
    for (let i = 1; i < maxRows; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const dateRaw = row[0];
      const titleRaw = row[1];
      const incomeRaw = row[2];
      const expenseRaw = row[3];
      const thaiPlusRaw = row[4];

      // ตรวจสอบสีพื้นหลังของ cell ใน column F
      const bgColor = backgroundColors[i - 1];
      console.log(`Row ${i} background color:`, bgColor);

      // ตรวจสอบ Thai+ จากสีพื้นหลัง (สีฟ้า = ใช่)
      let isThaiPlus = false;
      if (bgColor) {
        // ตรวจสอบว่าเป็นสีฟ้าหรือไม่ (blue component > red and green)
        const red = bgColor.red || 0;
        const green = bgColor.green || 0;
        const blue = bgColor.blue || 0;
        console.log(`Row ${i} RGB: R=${red}, G=${green}, B=${blue}`);

        // สีฟ้ามี blue สูงกว่า red และ green
        if (blue > red && blue > green) {
          isThaiPlus = true;
        }
      }

      // ถ้าไม่มีสีพื้นหลัง ให้ตรวจสอบจากค่าใน cell
      if (!bgColor) {
        const thaiPlusStr = String(thaiPlusRaw || '').toLowerCase().trim();
        isThaiPlus = thaiPlusStr === 'ใช่' || thaiPlusStr === 'yes' || thaiPlusStr === 'true' || thaiPlusStr === '1';
      }

      // Parse date
      let date = '';
      if (dateRaw) {
        const dateStr = String(dateRaw).trim();
        // Try to parse Thai date format (d/m/yy or d/m/yyyy)
        const thaiDateMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (thaiDateMatch) {
          const day = thaiDateMatch[1].padStart(2, '0');
          const month = thaiDateMatch[2].padStart(2, '0');
          let year = thaiDateMatch[3];

          // Convert 2-digit year to 4-digit (assuming Buddhist Era)
          if (year.length === 2) {
            year = '25' + year;
          }

          // Convert Buddhist Era to Christian Era (only if year > 2500)
          const yearNum = parseInt(year);
          const ceYear = yearNum > 2500 ? yearNum - 543 : yearNum;
          date = `${ceYear}-${month}-${day}`;
        } else {
          // Try standard date format
          const standardDate = new Date(dateStr);
          if (!isNaN(standardDate.getTime())) {
            date = standardDate.toISOString().split('T')[0];
          }
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
        date: date || new Date().toISOString().split('T')[0],
        type,
        isThaiPlus
      });
    }

    console.log(`Total valid items: ${items.length}`);

    if (items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรายการที่ถูกต้องใน Google Sheets' }, { status: 400 });
    }

    // ถ้า autoSave=true ให้บันทึกลง database อัตโนมัติ
    if (autoSave) {
      console.log('Auto-saving items to database...');
      try {
        await Promise.all(items.map((item) => addDoc(collection(db, 'expenses'), {
          title: item.title,
          amount: item.amount,
          category: 'other',
          date: item.date,
          type: item.type,
          isThaiPlus: item.isThaiPlus,
          createdAt: serverTimestamp(),
          recordedBy: 'Google Sheets Auto Sync'
        })));
        console.log('Auto-save completed successfully');
        return NextResponse.json({ 
          items, 
          count: items.length, 
          autoSaved: true,
          message: 'Sync และบันทึกข้อมูลสำเร็จ' 
        });
      } catch (saveError) {
        console.error('Auto-save error:', saveError);
        return NextResponse.json({ 
          error: 'Sync สำเร็จแต่บันทึกข้อมูลล้มเหลว: ' + (saveError as any)?.message 
        }, { status: 500 });
      }
    }

    // ถ้าไม่ autoSave ให้คืนค่าข้อมูลเพื่อให้ user กดบันทึกเอง
    return NextResponse.json({ items, count: items.length, autoSaved: false });
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอ่าน Google Sheets: ' + (err?.message || 'Unknown error') }, { status: 500 });
  }
}

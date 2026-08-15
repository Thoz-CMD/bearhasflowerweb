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

export async function GET(req: Request) {
  return NextResponse.json({ 
    message: 'Google Sheets Sync API is working. Use POST method to sync data.',
    status: 'ok'
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const autoSave = body.autoSave === true;

    console.log('Starting Google Sheets sync...');
    console.log('Environment check:', !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    // อ่าน credentials จาก environment variable (สำหรับ production) หรือไฟล์ (สำหรับ local)
    let credentials;
    
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        // ใช้ environment variable (production)
        console.log('Using environment variable for credentials');
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      } else {
        // ใช้ไฟล์ (local development)
        console.log('Using file for credentials');
        const serviceAccountPath = join(process.cwd(), 'service-account.json');
        credentials = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading credentials:', e);
      throw new Error('ไม่สามารถโหลด Google Service Account credentials: ' + (e as Error).message);
    }

    console.log('Credentials loaded:', Object.keys(credentials));
    console.log('client_email:', credentials.client_email);
    console.log('private_key exists:', !!credentials.private_key);

    // ตรวจสอบว่ามี client_email และ private_key
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error(`Service account JSON ไม่มี client_email หรือ private_key. Keys: ${Object.keys(credentials).join(', ')}`);
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
    console.log('Number of rows:', rows?.length);

    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Google Sheets ไม่มีข้อมูล' }, { status: 400 });
    }

    // ดึงข้อมูลสีพื้นหลังจาก column F
    const backgroundColors: any[] = [];
    try {
      const sheetData = formatResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];
      for (let i = 1; i < rows.length; i++) {
        const cellData = sheetData[i]?.values?.[0];
        const bgColor = cellData?.effectiveFormat?.backgroundColor;
        backgroundColors.push(bgColor);
      }
      console.log('Background colors:', backgroundColors);
    } catch (e) {
      console.log('Error reading background colors:', e);
    }

    // Skip header row (row 0), process data rows
    const items: ExpenseItem[] = [];
    
    console.log('Processing rows...');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      console.log(`Row ${i}:`, row);

      // Column A: วันที่ (index 0)
      const dateRaw = row[0];
      // Column B: รายละเอียด (index 1)
      const titleRaw = row[1];
      // Column C: รายรับ (index 2)
      const incomeRaw = row[2];
      // Column D: รายจ่าย (index 3)
      const expenseRaw = row[3];
      // Column E: ยอดคงเหลือ (index 4) - skip
      // Column F: ไทย+ (index 5)
      const thaiPlusRaw = row[5];
      
      // ตรวจสอบสีพื้นหลังของ cell ใน column F
      const bgColor = backgroundColors[i - 1];
      console.log(`Row ${i} background color:`, bgColor);
      
      // ตรวจสอบ Thai+ จากสีพื้นหลัง (สีฟ้า = ใช่, สีม่วง = ไม่ใช่)
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

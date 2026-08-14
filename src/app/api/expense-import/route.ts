import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

type ExpenseItem = {
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  isThaiPlus: boolean;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const startRowRaw = formData.get('startRow') as string;
    const startRow = startRowRaw ? parseInt(startRowRaw) : 2;

    if (!file) {
      return NextResponse.json({ error: 'กรุณาอัพโหลดไฟล์ Excel' }, { status: 400 });
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ .xlsx, .xls และ .csv เท่านั้น' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (!jsonData || jsonData.length < startRow) {
      return NextResponse.json({ error: `ไฟล์ Excel ไม่มีข้อมูลตั้งแต่แถวที่ ${startRow}` }, { status: 400 });
    }

    // Process data rows starting from the specified row (Excel uses 1-based indexing, but array is 0-based)
    // If user says startRow=2, that means Excel row 2, which is array index 1
    const startIndex = startRow - 1;
    const items: ExpenseItem[] = [];
    
    for (let i = startIndex; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

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
          
          // Convert Buddhist Era to Christian Era
          const yearNum = parseInt(year);
          const ceYear = yearNum - 543;
          date = `${ceYear}-${month}-${day}`;
        } else {
          // Try standard date format
          const standardDate = new Date(dateStr);
          if (!isNaN(standardDate.getTime())) {
            date = standardDate.toISOString().split('T')[0];
          }
        }
      }

      // Parse amount and type
      const income = parseFloat(String(incomeRaw || '0')) || 0;
      const expense = parseFloat(String(expenseRaw || '0')) || 0;
      
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

      // Skip if no amount
      if (amount === 0) continue;

      // Parse Thai+ flag
      const thaiPlusStr = String(thaiPlusRaw || '').toLowerCase().trim();
      const isThaiPlus = thaiPlusStr === 'ใช่' || thaiPlusStr === 'yes' || thaiPlusStr === 'true' || thaiPlusStr === '1';

      // Parse title
      const title = String(titleRaw || 'รายการจาก Excel').trim();

      if (!title) continue;

      items.push({
        title,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        type,
        isThaiPlus
      });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรายการที่ถูกต้องในไฟล์' }, { status: 400 });
    }

    return NextResponse.json({ items, count: items.length });
  } catch (err: any) {
    console.error('Excel import error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' + (err?.message || 'Unknown error') }, { status: 500 });
  }
}

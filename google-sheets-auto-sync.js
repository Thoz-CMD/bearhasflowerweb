// Google Apps Script for Auto-Sync Google Sheets to Web Application
// วิธีติดตั้ง:
// 1. เปิด Google Sheets
// 2. ไปที่ Extensions > Apps Script
// 3. คัดลอกโค้ดนี้ไปวางใน Code Editor
// 4. เปลี่ยน API_URL เป็น URL ของเว็บแอปพลิเคชันของคุณ
// 5. ไปที่ Triggers > Add Trigger
// 6. ตั้งค่า: On edit, From spreadsheet, On edit
// 7. บันทึกและทดสอบ

const API_URL = 'https://bearhasflower.vercel.app/api/google-sheets-sync'; // Production URL

function onEdit(e) {
  // ถ้ารันด้วยตนเอง (ไม่ใช่ trigger) ให้ sync เลย
  if (!e) {
    syncToDatabase();
    return;
  }

  // ตรวจสอบว่าการแก้ไขเกิดขึ้นใน sheet ที่ต้องการ
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();

  // ตรวจสอบว่าเป็น sheet ที่ต้องการ sync (เช่น "ชีต1" หรือ "หมีมีดอกไม้")
  if (sheetName !== 'ชีต1' && sheetName !== 'หมีมีดอกไม้') {
    return;
  }

  // ตรวจสอบว่าการแก้ไขเกิดขึ้นใน column A-F (ข้อมูลหลัก)
  const range = e.range;
  const column = range.getColumn();
  if (column < 1 || column > 6) {
    return;
  }

  // ตรวจสอบว่าไม่ใช่การแก้ไข header row (แถว 1)
  const row = range.getRow();
  if (row === 1) {
    return;
  }

  // เรียก API เพื่อ sync ข้อมูล
  syncToDatabase();
}

function syncToDatabase() {
  try {
    console.log('Starting syncToDatabase...');
    console.log('API_URL:', API_URL);
    
    const payload = {
      autoSave: true
    };
    
    console.log('Payload:', JSON.stringify(payload));
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: {
        'Accept': 'application/json'
      },
      validateHttpsCertificates: true
    };
    
    console.log('Fetching API with timeout...');
    // Set timeout to 60 seconds
    const response = UrlFetchApp.fetch(API_URL, options);
    console.log('Response received');
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    console.log('Response code:', responseCode);
    console.log('Response body:', responseBody);
    
    if (responseCode === 200) {
      const result = JSON.parse(responseBody);
      console.log('Sync successful:', result);
      
      // แสดง toast notification (ถ้าต้องการ)
      // SpreadsheetApp.getActiveSpreadsheet().toast('Sync สำเร็จ: ' + result.count + ' รายการ');
    } else {
      console.error('Sync failed:', responseCode, responseBody);
    }
  } catch (error) {
    console.error('Sync error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// ฟังก์ชันสำหรับทดสอบ manual sync
function testSync() {
  syncToDatabase();
}

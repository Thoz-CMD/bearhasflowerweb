// Google Apps Script for Auto-Sync Google Sheets to Web Application
// วิธีติดตั้ง:
// 1. เปิด Google Sheets
// 2. ไปที่ Extensions > Apps Script (ส่วนขยาย > Apps Script)
// 3. คัดลอกโค้ดนี้ไปวางใน Code Editor
// 4. เปลี่ยน API_URL เป็น URL ของเว็บแอปพลิเคชันของคุณ
// 5. ไปที่ Triggers > Add Trigger
// 6. ตั้งค่า: On edit, From spreadsheet, On edit
// 7. บันทึกและทดสอบ

const API_URL = 'https://bearhasflower.vercel.app/api/google-sheets-sync'; // Production URL

function onEdit(e) {
  if (!e) {
    syncToDatabase();
    return;
  }

  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();

  if (sheetName !== 'ชีต1' && sheetName !== 'หมีมีดอกไม้') {
    return;
  }

  const range = e.range;
  const column = range.getColumn();
  if (column < 1 || column > 6) {
    return;
  }

  const row = range.getRow();
  if (row === 1) {
    return;
  }

  syncToDatabase();
}

function syncToDatabase() {
  try {
    Logger.log('Starting syncToDatabase...');
    Logger.log('API_URL: ' + API_URL);
    
    const payload = {
      autoSave: true
    };
    
    Logger.log('Payload: ' + JSON.stringify(payload));
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    Logger.log('Fetching API...');
    const response = UrlFetchApp.fetch(API_URL, options);
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log('Response code: ' + responseCode);
    Logger.log('Response body: ' + responseBody);
    
    if (responseCode === 200) {
      const result = JSON.parse(responseBody);
      Logger.log('Sync successful: ' + JSON.stringify(result));
      
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) {
          ss.toast('Sync สำเร็จ: ' + result.count + ' รายการ', 'Google Sheets Sync');
        }
      } catch (e) {}
    } else {
      Logger.log('Sync failed: ' + responseCode + ' ' + responseBody);
    }
  } catch (error) {
    Logger.log('Sync error: ' + error.message);
  }
}

// ฟังก์ชันสำหรับทดสอบ manual sync
function testSync() {
  syncToDatabase();
}

// Google Apps Script for Auto-Sync Google Sheets to Web Application
// วิธีติดตั้ง Auto Sync:
// 1. คัดลอกโค้ดนี้ไปวางใน Google Apps Script Editor แทนที่โค้ดเดิมทั้งหมด แล้วกด บันทึก (Ctrl+S)
// 2. ไปที่เมนูด้านซ้าย เลือกไอคอนรูปนาฬิกา ⏰ "ทริกเกอร์" (Triggers)
// 3. กด "เพิ่มทริกเกอร์" (Add Trigger) มุมขวาล่าง
// 4. ตั้งค่าดังนี้:
//    - เลือกฟังก์ชันที่จะเรียกใช้: autoSyncOnEdit (หรือ syncToDatabase)
//    - เลือกแหล่งที่มาของกิจกรรม: จาก แผ่นตารางทำการ (From spreadsheet)
//    - เลือกประเภทเหตุการณ์: เมื่อแก้ไข (On edit)
// 5. กด บันทึก (Save) และอนุมัติสิทธิ์

const API_URL = 'https://bearhasflower.vercel.app/api/google-sheets-sync'; // Production URL

// ฟังก์ชันที่จะถูกเรียกใช้อัตโนมัติโดย Trigger เมื่อมีการพิมพ์แก้ไขในชีต
function autoSyncOnEdit(e) {
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
          ss.toast('Auto Sync สำเร็จ: ' + result.count + ' รายการ', 'Google Sheets Auto Sync');
        }
      } catch (e) {}
    } else {
      Logger.log('Sync failed: ' + responseCode + ' ' + responseBody);
    }
  } catch (error) {
    Logger.log('Sync error: ' + error.message);
  }
}

// ฟังก์ชันสำหรับกดทดสอบรันด้วยมือ
function testSync() {
  syncToDatabase();
}

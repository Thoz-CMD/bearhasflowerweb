// Google Apps Script for Scheduled Auto-Sync Google Sheets to Web Application
// วิธีตั้งเวลา Auto Sync (Time-driven Trigger):
// 1. คัดลอกโค้ดนี้ไปวางใน Google Apps Script Editor แล้วกด บันทึก (Ctrl+S)
// 2. ไปที่เมนูด้านซ้าย เลือกไอคอนรูปนาฬิกา ⏰ "ทริกเกอร์" (Triggers)
// 3. ลบทริกเกอร์เดิมออก แล้วกด "เพิ่มทริกเกอร์" (Add Trigger) มุมขวาล่าง
// 4. ตั้งค่าทริกเกอร์ตามเวลาดังนี้:
//    - เลือกฟังก์ชันที่จะเรียกใช้: scheduledSyncToDatabase (หรือ syncToDatabase)
//    - เลือกแหล่งที่มาของกิจกรรม: ตามเวลา (Time-driven)
//    - เลือกประเภททริกเกอร์ตามเวลา: ตัวนับเวลาเป็นนาที (Minute timer)
//    - เลือกระหว่างเวลา: ทุก 1 นาที / ทุก 5 นาที / ทุก 15 นาที (ตามต้องการ)
// 5. กด บันทึก (Save)

const API_URL = 'https://bearhasflower.vercel.app/api/google-sheets-sync'; // Production URL

// ฟังก์ชันที่จะทำงานตามรอบเวลาที่ตั้งไว้
function scheduledSyncToDatabase() {
  syncToDatabase();
}

function syncToDatabase() {
  try {
    Logger.log('Starting syncToDatabase...');
    
    const payload = {
      autoSave: true
    };
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(API_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log('Response Code: ' + responseCode);
    Logger.log('Response Body: ' + responseBody);
    
    if (responseCode === 200) {
      const result = JSON.parse(responseBody);
      Logger.log('Sync Successful: ' + result.count + ' items');
    } else {
      Logger.log('Sync Failed: ' + responseCode + ' - ' + responseBody);
    }
  } catch (error) {
    Logger.log('Sync Error: ' + error.message);
  }
}

// ฟังก์ชันสำหรับทดสอบรันด้วยมือ
function testSync() {
  syncToDatabase();
}

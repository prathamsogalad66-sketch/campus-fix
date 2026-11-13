/**
 * WhatsApp Notification Helper — SDMCET Campus Fix
 * Uses Green API (https://green-api.com) — FREE plan available.
 *
 * HOW IT WORKS:
 *  - You link YOUR personal WhatsApp number to Green API (like scanning WhatsApp Web QR)
 *  - Messages appear to come FROM your WhatsApp number
 *  - Workers receive them directly — NO registration or app install needed on their side
 *
 * SETUP (one-time, takes ~2 minutes):
 *  1. Go to https://green-api.com → Sign up free
 *  2. Create a new instance → choose Developer (Free) plan
 *  3. Scan the QR code with your WhatsApp (Settings → Linked Devices → Link a Device)
 *  4. Copy your idInstance and apiTokenInstance into .env
 */

require('dotenv').config();
const https = require('https');

// ─── Worker phone number registry (server-side only, never sent to frontend) ───
// Format: E.164 without the '+' sign (Green API uses countryCode+number, e.g. 919845123456)
const WORKER_PHONES = {
    'Ramesh Kumar': process.env.WORKER_RAMESH_PHONE || '918123751706',
    'Suresh Patil': process.env.WORKER_SURESH_PHONE || '917795369555',
    'Anand Deshpande': process.env.WORKER_ANAND_PHONE || '919845345623',
    'Kumar Naik': process.env.WORKER_KUMAR_PHONE || '919845456734',
    'Sunita Hiremath': process.env.WORKER_SUNITA_PHONE || '919845567845',
    'Prakash Joshi': process.env.WORKER_PRAKASH_PHONE || '916366021757',
};

/**
 * Extracts the base worker name from "Ramesh Kumar (Electrician)" → "Ramesh Kumar"
 */
function extractWorkerName(str) {
    if (!str) return null;
    const match = str.match(/^([^(]+)/);
    return match ? match[1].trim() : str.trim();
}

/**
 * Send a WhatsApp message using Green API (plain HTTPS, no external SDK).
 * @param {string} phone   - Phone number without '+', e.g. "919845123401"
 * @param {string} message - Message text
 */
async function sendWhatsAppMessage(phone, message) {
    const idInstance = process.env.GREEN_API_INSTANCE_ID;
    const apiToken = process.env.GREEN_API_TOKEN;
    const apiHost = process.env.GREEN_API_HOST || '1103.api.green-api.com'; // shown in your Green API console

    if (!idInstance || !apiToken) {
        console.warn('[WhatsApp] Green API credentials not set in .env — skipping notification.');
        return {
            success: false,
            skipped: true,
            reasonCode: 'not_configured',
            reason: 'Green API credentials are not configured.',
        };
    }

    const url = `https://${apiHost}/waInstance${idInstance}/sendMessage/${apiToken}`;
    const body = JSON.stringify({
        chatId: `${phone}@c.us`,
        message: message,
    });

    return new Promise((resolve) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.idMessage) {
                        console.log(`[WhatsApp] ✅ Message sent to ${phone} | ID: ${parsed.idMessage}`);
                        resolve({ success: true, id: parsed.idMessage });
                    } else {
                        console.error(`[WhatsApp] ❌ Unexpected response:`, data);
                        resolve({ success: false, reason: data });
                    }
                } catch {
                    console.error('[WhatsApp] Failed to parse response:', data);
                    resolve({ success: false, reason: data });
                }
            });
        });

        req.on('error', (err) => {
            console.error('[WhatsApp] Request error:', err.message);
            resolve({ success: false, reason: err.message });
        });

        req.write(body);
        req.end();
    });
}

/**
 * Notify a campus worker about their new task assignment via WhatsApp.
 * Called automatically when admin assigns a worker in the admin portal.
 *
 * @param {Object} opts
 * @param {string} opts.assignedWorker  - e.g. "Ramesh Kumar (Electrician)"
 * @param {string} opts.issueTitle
 * @param {string} opts.location
 * @param {string} opts.priority
 * @param {string} opts.adminNotes
 */
async function notifyWorkerAssignment({ assignedWorker, issueTitle, location, priority, adminNotes, completionUrl }) {
    if (!assignedWorker || assignedWorker === 'Unassigned') {
        return { success: false, skipped: true, reasonCode: 'not_assigned' };
    }

    const name = extractWorkerName(assignedWorker);
    const phone = WORKER_PHONES[name];

    if (!phone) {
        console.warn(`[WhatsApp] No phone number registered for: "${assignedWorker}"`);
        return {
            success: false,
            skipped: true,
            reasonCode: 'no_phone',
            reason: 'No WhatsApp phone number is registered for this worker.',
        };
    }

    const priorityEmoji = { Urgent: '🚨', High: '🔴', Medium: '🟡', Low: '🟢' }[priority] || '📋';

    const message = [
        `🏫 *SDMCET Campus Fix — New Task Assigned*`,
        ``,
        `${priorityEmoji} *Priority:* ${priority || 'Not set'}`,
        `📍 *Location:* ${location}`,
        `🔧 *Problem:* ${issueTitle}`,
        ``,
        `📝 *Admin Notes:*`,
        `${adminNotes || 'No additional notes.'}`,
        ``,
        `Please attend to this at the earliest. Contact the Estate Office if you need assistance.`,
        ...(completionUrl ? ['', `✅ Tap this link to update your work order:`, completionUrl] : []),
        `— SDMCET Estates Management`,
    ].join('\n');

    return sendWhatsAppMessage(phone, message);
}

function getWhatsAppUrl(phone, { issueTitle, location, priority, adminNotes, completionUrl }) {
    if (!phone) return null;
    const clean = String(phone).replace(/\D/g, '');
    const target = clean.startsWith('91') && clean.length > 10 ? clean : `91${clean.replace(/^0+/, '')}`;
    const priorityEmoji = { Urgent: '🚨', High: '🔴', Medium: '🟡', Low: '🟢' }[priority] || '📋';
    const message = [
        `🏫 *SDMCET Campus Fix — New Task Assigned*`,
        ``,
        `${priorityEmoji} *Priority:* ${priority || 'Not set'}`,
        `📍 *Location:* ${location}`,
        `🔧 *Problem:* ${issueTitle}`,
        ``,
        `📝 *Admin Notes:*`,
        `${adminNotes || 'No additional notes.'}`,
        ``,
        `Please attend to this at the earliest. Contact the Estate Office if you need assistance.`,
        ...(completionUrl ? ['', `✅ Tap this link to update your work order:`, completionUrl] : []),
        `— SDMCET Estates Management`,
    ].join('\n');
    return `https://api.whatsapp.com/send?phone=${target}&text=${encodeURIComponent(message)}`;
}

module.exports = { notifyWorkerAssignment, getWhatsAppUrl, extractWorkerName, WORKER_PHONES };

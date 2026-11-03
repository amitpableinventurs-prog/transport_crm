const twilio = require('twilio');

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const sendSms = async (to, message) => {
    const hasNumber = process.env.TWILIO_PHONE_NUMBER && 
                        process.env.TWILIO_PHONE_NUMBER !== 'dummy' && 
                        process.env.TWILIO_PHONE_NUMBER.trim() !== '';

    if (hasNumber && client) {
        try {
            const response = await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`[TWILIO SMS SENT] SID: ${response.sid}`);
            return true;
        } catch (error) {
            console.error('[TWILIO ERROR]:', error.message);
            throw new Error('Failed to send SMS via Twilio.');
        }
    } else {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Twilio is not configured for production SMS delivery.');
        }
        console.log(`\n==========================================`);
        console.log(`[MOCK SMS] To: ${to}`);
        console.log(`[MOCK CONTENT] ${message}`);
        console.log(`==========================================\n`);
        return true;
    }
};

module.exports = { client, sendSms };
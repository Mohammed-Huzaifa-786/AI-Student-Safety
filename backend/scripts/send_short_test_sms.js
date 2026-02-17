import dotenv from 'dotenv';
dotenv.config();
import Twilio from 'twilio';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM;
const TO = process.argv[2] || process.env.ALERT_SMS_RECEIVER || '+916360450297';

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env');
  process.exit(1);
}
if (!FROM) {
  console.error('TWILIO_FROM must be set in .env');
  process.exit(1);
}

const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);

(async function send() {
  try {
    console.log('Sending short test SMS to', TO);
    const msg = await client.messages.create({
      body: 'Test SMS — ignore',
      from: FROM,
      to: TO,
    });
    console.log('Send response SID:', msg.sid, 'status:', msg.status);
    // Optionally fetch status immediately
    const fetched = await client.messages(msg.sid).fetch();
    console.log('Fetched status:', fetched.status, 'errorCode:', fetched.errorCode, 'errorMessage:', fetched.errorMessage);
  } catch (err) {
    console.error('Failed to send test SMS:', err.message || err);
    process.exit(1);
  }
})();

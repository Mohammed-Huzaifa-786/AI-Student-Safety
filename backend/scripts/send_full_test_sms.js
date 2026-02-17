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

function buildBody({ userId, latitude, longitude, message, createdAt }) {
  const timeStr = new Date(createdAt || Date.now()).toLocaleString();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const lines = [];
  lines.push(`🚨 Emergency Alert: ${userId}`);
  lines.push('AI Student Safety <aistudentsafety@gmail.com>');
  lines.push(timeStr);
  lines.push('');
  lines.push('🚨 Emergency Alert Triggered');
  lines.push(`User: ${userId}`);
  lines.push('');
  lines.push(`Time: ${timeStr}`);
  lines.push(`Location: ${latitude}, ${longitude} — Open in Google Maps`);
  lines.push('');
  lines.push(`Message: ${message}`);
  return lines.join('\n');
}

(async function send() {
  try {
    const payload = {
      userId: 'HUZAIFA001',
      latitude: 13.1345416,
      longitude: 77.5680498,
      message: 'Emergency alert triggered from mobile app!',
      createdAt: new Date().toISOString(),
    };
    const body = buildBody(payload);
    console.log('Sending full formatted SMS to', TO);
    const msg = await client.messages.create({
      body,
      from: FROM,
      to: TO,
      // include statusCallback if set in env
      ...(process.env.TWILIO_STATUS_CALLBACK ? { statusCallback: process.env.TWILIO_STATUS_CALLBACK } : {}),
    });
    console.log('Send response SID:', msg.sid, 'status:', msg.status);
    const fetched = await client.messages(msg.sid).fetch();
    console.log('Fetched status:', fetched.status, 'errorCode:', fetched.errorCode, 'errorMessage:', fetched.errorMessage);
  } catch (err) {
    console.error('Failed to send full SMS:', err.message || err);
    process.exit(1);
  }
})();

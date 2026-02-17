import dotenv from 'dotenv';
dotenv.config();
import Twilio from 'twilio';

const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function fetchStatus(sid) {
  try {
    const msg = await client.messages(sid).fetch();
    console.log('SID:', msg.sid);
    console.log('Status:', msg.status);
    console.log('Error Code:', msg.errorCode);
    console.log('Error Message:', msg.errorMessage);
    console.log('From:', msg.from, 'To:', msg.to);
    console.log('Date Created:', msg.dateCreated);
    console.log('---------------------------');
  } catch (err) {
    console.error('Failed to fetch', sid, err.message || err);
  }
}

(async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node check_twilio_messages.js <SID1> [SID2]...');
    process.exit(1);
  }
  for (const sid of args) {
    // basic validation
    if (!/^SM[0-9a-fA-F]+$/.test(sid)) {
      console.error('Invalid SID format:', sid);
      continue;
    }
    await fetchStatus(sid);
  }
  process.exit(0);
})();

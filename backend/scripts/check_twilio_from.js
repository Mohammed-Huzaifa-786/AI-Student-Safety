import dotenv from 'dotenv';
dotenv.config();
import Twilio from 'twilio';

const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function main() {
  const from = process.env.TWILIO_FROM;
  if (!from) {
    console.error('TWILIO_FROM not set in .env');
    process.exit(1);
  }
  try {
    const numbers = await client.incomingPhoneNumbers.list({phoneNumber: from, limit: 20});
    if (numbers.length === 0) {
      console.log('No incoming phone number resource found for', from);
      console.log('It may still be a valid Twilio number but not present as IncomingPhoneNumber resource (check console).');
    } else {
      for (const n of numbers) {
        console.log('Phone Number:', n.phoneNumber);
        console.log('Capabilities:', n.capabilities);
        console.log('Voice URL:', n.voiceUrl);
        console.log('Sms URL:', n.smsUrl);
        console.log('---------------------------');
      }
    }
  } catch (err) {
    console.error('Failed to look up Twilio number:', err.message || err);
  }
}

main().then(()=>process.exit(0)).catch(()=>process.exit(1));

import dotenv from "dotenv";
dotenv.config();

export const config = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM, // e.g. +1234567890
  },
  env: process.env.NODE_ENV || "development",
};
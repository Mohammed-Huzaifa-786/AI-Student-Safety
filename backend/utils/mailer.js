import nodemailer from "nodemailer";

export const getTransporter = () => {
  // Gmail SMTP
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // 465 = secure
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendAlertEmail = async ({ userId, latitude, longitude, message, createdAt }) => {
  const transporter = getTransporter();

  const toList = (process.env.ALERT_RECEIVER || "").split(",").map(s => s.trim()).filter(Boolean);
  if (toList.length === 0) throw new Error("No ALERT_RECEIVER configured");

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const subject = `🚨 Emergency Alert: ${userId}`;
  const text = [
    `Emergency alert triggered!`,
    `User: ${userId}`,
    `Time: ${new Date(createdAt).toLocaleString()}`,
    `Location: ${latitude}, ${longitude}`,
    `Maps: ${mapsLink}`,
    `Message: ${message || "(no message)"}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
      <h2>🚨 Emergency Alert Triggered</h2>
      <p><b>User:</b> ${userId}</p>
      <p><b>Time:</b> ${new Date(createdAt).toLocaleString()}</p>
      <p><b>Location:</b> ${latitude}, ${longitude} —
        <a href="${mapsLink}" target="_blank">Open in Google Maps</a>
      </p>
      <p><b>Message:</b> ${message || "(no message)"}</p>
      <hr/>
      <small>AI Student Safety System</small>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"AI Student Safety" <${process.env.EMAIL_USER}>`,
      to: toList,           // array supported
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('sendAlertEmail failed:', err?.message || err);
    // Re-throw so callers can decide how to handle (and we retain original stack)
    throw err;
  }
};

const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to, message) {
  try {
    const res = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: `+91${to}`
    });

    console.log(" SID:", res.sid);
  } catch (err) {
    console.log("FULL ERROR:", err.code, err.message);
  }
}

module.exports = sendSMS;

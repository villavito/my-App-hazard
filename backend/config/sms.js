// Sends SMS messages (password reset codes) through whichever provider is
// configured in backend/.env:
//   Semaphore (PH):  SEMAPHORE_API_KEY, optional SEMAPHORE_SENDER_NAME
//   Twilio:          TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
//   TextBee (free):  TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID - sends from an Android
//                    phone's own SIM via the TextBee app (https://textbee.dev)
// Without a provider, delivery fails explicitly instead of pretending the
// message was sent.

const isSmsConfigured = () =>
  Boolean(
    process.env.SEMAPHORE_API_KEY ||
      (process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID) ||
      (process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER),
  );

// `to` is an E.164 Philippine number, e.g. "+639171234567".
async function sendSms(to, message) {
  if (process.env.SEMAPHORE_API_KEY) {
    const body = new URLSearchParams({
      apikey: process.env.SEMAPHORE_API_KEY,
      // Semaphore expects the local "09XXXXXXXXX" form.
      number: to.replace(/^\+63/, "0"),
      message,
    });
    if (process.env.SEMAPHORE_SENDER_NAME) {
      body.set("sendername", process.env.SEMAPHORE_SENDER_NAME);
    }
    const res = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      body,
    });
    if (!res.ok) {
      throw new Error(`Semaphore SMS failed: ${res.status} ${await res.text()}`);
    }
    return;
  }

  if (process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID) {
    const res = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.TEXTBEE_API_KEY,
        },
        body: JSON.stringify({ recipients: [to], message }),
      },
    );
    if (!res.ok) {
      throw new Error(`TextBee SMS failed: ${res.status} ${await res.text()}`);
    }
    return;
  }

  if (isSmsConfigured()) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString(
              "base64",
            ),
        },
        body: new URLSearchParams({
          To: to,
          From: process.env.TWILIO_FROM_NUMBER,
          Body: message,
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`Twilio SMS failed: ${res.status} ${await res.text()}`);
    }
    return;
  }

  throw new Error("No SMS provider is configured");
}

module.exports = { sendSms, isSmsConfigured };

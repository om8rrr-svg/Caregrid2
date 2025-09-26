export async function sendSMS(to: string[], body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.warn('[alerts/sms] Twilio creds missing. Printing instead.');
    console.log({ to, body });
    return;
  }
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  await Promise.all(
    to.map((num) =>
      fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: String(from), To: String(num), Body: body }),
      })
    )
  );
}
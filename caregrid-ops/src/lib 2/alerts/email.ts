export async function sendEmail(to: string[], subject: string, html: string) {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.ALERTS_FROM_EMAIL || 'ops@caregrid.co.uk';
  if (!key) {
    console.warn('[alerts/email] SENDGRID_API_KEY missing. Printing instead.');
    console.log({ to, subject, html });
    return;
  }
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: to.map((e) => ({ email: e })) }],
      from: { email: from },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
}
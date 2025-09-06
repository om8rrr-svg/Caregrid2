import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/alerts/email';
import { sendSMS } from '@/lib/alerts/sms';
import { postSlack } from '@/lib/alerts/slack';

export async function POST() {
  await Promise.all([
    sendEmail([process.env.OPS_ALERT_EMAIL || 'ops@caregrid.co.uk'], 'CareGrid Ops Test Alert', '<b>Test OK</b>'),
    sendSMS([process.env.OPS_ALERT_PHONE || ''], '[CareGrid Ops] Test alert OK'),
    postSlack(':white_check_mark: CareGrid Ops test alert OK')
  ]);
  return NextResponse.json({ ok: true });
}
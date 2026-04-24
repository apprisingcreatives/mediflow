import twilio from 'twilio';

if (typeof window !== 'undefined') {
  throw new Error('twilio.ts must only be imported server-side');
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

export async function sendSMS(
  to: string,
  body: string,
): Promise<{ sid: string; status: string }> {
  if (!fromNumber) {
    throw new Error('Missing TWILIO_PHONE_NUMBER');
  }
  const message = await getClient().messages.create({
    body,
    to,
    from: fromNumber,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
  });
  return { sid: message.sid, status: message.status };
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}

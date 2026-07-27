import axios from 'axios';

if (typeof window !== 'undefined') {
  throw new Error('unisms.ts must only be imported server-side');
}

const apiKey = process.env.UNISMS_API_KEY;
const senderId = process.env.UNISMS_SENDER_ID || 'MediFlow';

const UNISMS_API = 'https://unismsapi.com/api/sms';

export async function sendSMS(
  to: string,
  body: string,
): Promise<{ messageId: string; status: string }> {
  if (!apiKey) {
    throw new Error('Missing UNISMS_API_KEY');
  }

  try {
    const response = await axios.post(
      UNISMS_API,
      {
        recipient: to,
        content: body,
        sender_id: senderId,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: apiKey, password: '' },
      },
    );

    const msg = response.data?.message || {};
    return {
      messageId: msg.reference_id || '',
      status: msg.status || 'sent',
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('UniSMS API error:', JSON.stringify(error.response?.data, null, 2));
    }
    throw error;
  }
}

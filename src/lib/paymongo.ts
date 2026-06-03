import axios from 'axios';

if (typeof window !== 'undefined') {
  throw new Error('paymongo.ts must only be imported server-side');
}

const secretKey = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';

function getAuthHeader() {
  if (!secretKey) throw new Error('Missing PAYMONGO_SECRET_KEY');
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

interface LineItem {
  name: string;
  amount: number;
  currency?: string;
  quantity?: number;
  description?: string;
}

interface CheckoutSessionParams {
  lineItems: LineItem[];
  description?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  referenceNumber?: string;
  merchantId?: string;
}

interface CheckoutSessionResponse {
  id: string;
  checkoutUrl: string;
  status: string;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResponse> {
  try {
    const useRedirectUrls = params.successUrl?.startsWith('https://');

    const response = await axios.post(
      `${PAYMONGO_API}/checkout_sessions`,
      {
        data: {
          attributes: {
            line_items: params.lineItems.map((item) => ({
              name: item.name,
              amount: item.amount,
              currency: item.currency || 'PHP',
              quantity: item.quantity || 1,
              description: item.description,
            })),
            description: params.description,
            metadata: params.metadata,
            ...(useRedirectUrls && {
              success_url: params.successUrl,
              cancel_url: params.cancelUrl,
            }),
            reference_number: params.referenceNumber,
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(),
          ...(params.merchantId && { 'Account-ID': params.merchantId }),
        },
      },
    );

    const session = response.data?.data;
    return {
      id: session.id,
      checkoutUrl: session.attributes?.checkout_url || session.attributes?.url,
      status: session.attributes?.status || 'open',
    };
  } catch (err: any) {
    const details = err?.response?.data?.errors || err?.response?.data;
    console.error('PayMongo createCheckoutSession error:', JSON.stringify(details, null, 2));
    throw err;
  }
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<{
  id: string;
  status: string;
  metadata: Record<string, string>;
  payments: Array<{ id: string; status: string; paidAt: number | null }>;
}> {
  const response = await axios.get(
    `${PAYMONGO_API}/checkout_sessions/${sessionId}`,
    {
      headers: { Authorization: getAuthHeader() },
    },
  );

  const session = response.data?.data;
  const attrs = session?.attributes || {};
  return {
    id: session.id,
    status: attrs.status,
    metadata: attrs.metadata || {},
    payments: (attrs.payments || []).map((p: any) => ({
      id: p.id,
      status: p.attributes?.status,
      paidAt: p.attributes?.paid_at,
    })),
  };
}

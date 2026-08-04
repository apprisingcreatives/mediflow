import axios from 'axios';
import crypto from 'crypto';

if (typeof window !== 'undefined') {
  throw new Error('paymongo.ts must only be imported server-side');
}

const secretKey = process.env.PAYMONGO_SECRET_KEY;
const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
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
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
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

export async function createRefund(params: {
  paymentId: string;
  amount: number;
  reason?: string;
  merchantId?: string;
}): Promise<{ id: string; status: string }> {
  try {
    const response = await axios.post(
      `${PAYMONGO_API}/refunds`,
      {
        data: {
          attributes: {
            payment_id: params.paymentId,
            amount: params.amount,
            reason: params.reason || 'requested_by_customer',
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

    const refund = response.data?.data;
    return {
      id: refund.id,
      status: refund.attributes?.status || 'pending',
    };
  } catch (err: any) {
    const details = err?.response?.data?.errors || err?.response?.data;
    console.error('PayMongo createRefund error:', JSON.stringify(details, null, 2));
    throw err;
  }
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  if (!webhookSecret) {
    console.error('PAYMONGO_WEBHOOK_SECRET not configured — rejecting webhook');
    return false;
  }

  const parts = signatureHeader.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const signaturePart = parts.find((p) => p.startsWith('te='));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.slice(2);
  const signature = signaturePart.slice(3);

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const SQUARE_API_BASE = 'https://connect.squareup.com';
const SQUARE_VERSION = '2025-01-23';

export class SquareApiError extends Error {
  status: number;
  errors: unknown;

  constructor(status: number, body: unknown) {
    const first = Array.isArray((body as { errors?: unknown[] })?.errors)
      ? (body as { errors: { detail?: string; code?: string }[] }).errors[0]
      : undefined;
    super(first?.detail || first?.code || 'Square API request failed');
    this.status = status;
    this.errors = body;
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function squareFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SQUARE_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env('SQUARE_ACCESS_TOKEN')}`,
      'Square-Version': SQUARE_VERSION,
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new SquareApiError(res.status, data);
  return data;
}

export interface TerminalCheckout {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CANCEL_REQUESTED' | 'COMPLETED' | 'CANCELED';
  cancel_reason?: string;
  reference_id?: string;
  amount_money: { amount: number; currency: string };
  payment_ids?: string[];
}

export async function createTerminalCheckout(params: {
  amountCents: number;
  referenceId: string;
  note?: string;
  idempotencyKey: string;
}): Promise<TerminalCheckout> {
  const data = await squareFetch('/v2/terminals/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      idempotency_key: params.idempotencyKey,
      checkout: {
        amount_money: { amount: params.amountCents, currency: 'USD' },
        reference_id: params.referenceId,
        note: params.note,
        device_options: { device_id: env('SQUARE_DEVICE_ID') },
        location_id: env('SQUARE_LOCATION_ID'),
      },
    }),
  });
  return data.checkout as TerminalCheckout;
}

export async function getTerminalCheckout(checkoutId: string): Promise<TerminalCheckout> {
  const data = await squareFetch(`/v2/terminals/checkouts/${checkoutId}`);
  return data.checkout as TerminalCheckout;
}

export async function cancelTerminalCheckout(checkoutId: string): Promise<TerminalCheckout> {
  const data = await squareFetch(`/v2/terminals/checkouts/${checkoutId}/cancel`, {
    method: 'POST',
  });
  return data.checkout as TerminalCheckout;
}

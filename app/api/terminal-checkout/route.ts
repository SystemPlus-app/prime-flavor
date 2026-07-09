import { NextRequest, NextResponse } from 'next/server';
import { createTerminalCheckout, SquareApiError } from '@/lib/square';

export async function POST(req: NextRequest) {
  let body: { amount?: number; referenceId?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { amount, referenceId, note } = body;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number (in dollars)' }, { status: 400 });
  }
  if (!referenceId || typeof referenceId !== 'string') {
    return NextResponse.json({ error: 'referenceId is required' }, { status: 400 });
  }

  const amountCents = Math.round(amount * 100);

  try {
    const checkout = await createTerminalCheckout({
      amountCents,
      referenceId,
      note,
      idempotencyKey: crypto.randomUUID(),
    });
    return NextResponse.json({ checkout });
  } catch (err) {
    if (err instanceof SquareApiError) {
      return NextResponse.json({ error: err.message, details: err.errors }, { status: err.status });
    }
    console.error('Failed to create Square terminal checkout', err);
    return NextResponse.json({ error: 'Failed to reach Square Terminal' }, { status: 502 });
  }
}

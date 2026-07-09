import { NextRequest, NextResponse } from 'next/server';
import { cancelTerminalCheckout, getTerminalCheckout, SquareApiError } from '@/lib/square';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params;
  try {
    const checkout = await getTerminalCheckout(checkoutId);
    return NextResponse.json({ checkout });
  } catch (err) {
    if (err instanceof SquareApiError) {
      return NextResponse.json({ error: err.message, details: err.errors }, { status: err.status });
    }
    console.error('Failed to fetch Square terminal checkout', err);
    return NextResponse.json({ error: 'Failed to reach Square Terminal' }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params;
  try {
    const checkout = await cancelTerminalCheckout(checkoutId);
    return NextResponse.json({ checkout });
  } catch (err) {
    if (err instanceof SquareApiError) {
      return NextResponse.json({ error: err.message, details: err.errors }, { status: err.status });
    }
    console.error('Failed to cancel Square terminal checkout', err);
    return NextResponse.json({ error: 'Failed to reach Square Terminal' }, { status: 502 });
  }
}

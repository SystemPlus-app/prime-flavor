import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { formatTicketNumber } from '@/lib/ticketBatchMapper';

interface RedeemItem {
  productId: string;
  quantity: number;
}

function parseTicketNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d{1,7}$/.test(trimmed)) return null;
  return Number.parseInt(trimmed, 10);
}

export async function POST(req: NextRequest) {
  let body: { ticketNumbers?: string[]; items?: RedeemItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { ticketNumbers, items } = body;

  if (!Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
    return NextResponse.json({ error: 'ticketNumbers must be a non-empty array' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 });
  }

  const parsedNumbers: number[] = [];
  for (const raw of ticketNumbers) {
    const n = parseTicketNumber(raw);
    if (n === null) {
      return NextResponse.json({ error: `"${raw}" is not a valid ticket number` }, { status: 400 });
    }
    parsedNumbers.push(n);
  }
  if (new Set(parsedNumbers).size !== parsedNumbers.length) {
    return NextResponse.json({ error: 'The same ticket was entered more than once' }, { status: 400 });
  }

  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  if (parsedNumbers.length !== totalUnits) {
    return NextResponse.json(
      { error: `This order needs exactly ${totalUnits} ticket(s) — ${parsedNumbers.length} entered.` },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();

  const { data: batches, error: batchesError } = await admin
    .from('ticket_batches')
    .select('*')
    .eq('active', true);

  if (batchesError) {
    console.error('Failed to load ticket batches', batchesError);
    return NextResponse.json({ error: 'Failed to validate tickets' }, { status: 500 });
  }

  function findBatch(n: number) {
    return (batches ?? []).find((b) => n >= (b.ticket_start as number) && n <= (b.ticket_end as number));
  }

  let matchedBatch: Record<string, unknown> | undefined;
  for (const n of parsedNumbers) {
    const batch = findBatch(n);
    if (!batch) {
      return NextResponse.json({ error: `Ticket #${formatTicketNumber(n)} is not valid or this event has ended.` }, { status: 400 });
    }
    if (matchedBatch && batch.id !== matchedBatch.id) {
      return NextResponse.json({ error: 'All tickets in one order must belong to the same event.' }, { status: 400 });
    }
    matchedBatch = batch;
  }

  const batch = matchedBatch!;
  const allowedProductIds = batch.allowed_product_ids as string[] | null;
  if (allowedProductIds && allowedProductIds.length > 0) {
    const invalidItem = items.find((i) => !allowedProductIds.includes(i.productId));
    if (invalidItem) {
      return NextResponse.json(
        { error: `This ticket only covers specific dishes. Remove items not included in "${batch.label}" and try again.` },
        { status: 400 },
      );
    }
  }

  const rows = parsedNumbers.map((n) => ({ batch_id: batch.id, ticket_number: n }));
  const { error: insertError } = await admin.from('redeemed_tickets').insert(rows);

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'One or more of these tickets have already been used.' }, { status: 409 });
    }
    console.error('Failed to redeem tickets', insertError);
    return NextResponse.json({ error: 'Failed to redeem tickets' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    batchId: batch.id as string,
    batchLabel: batch.label as string,
    ticketNumbers: parsedNumbers.map(formatTicketNumber),
  });
}

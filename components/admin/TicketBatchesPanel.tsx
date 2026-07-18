'use client';

import { useState } from 'react';
import type { Product } from '@/types/product';
import type { TicketBatch } from '@/types/ticketBatch';
import { formatTicketNumber } from '@/lib/ticketBatchMapper';
import { useOrderStore, type NewTicketBatch } from '@/store/orderStore';

interface Props {
  products: Product[];
}

function parseTicketInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,7}$/.test(trimmed)) return null;
  return Number.parseInt(trimmed, 10);
}

function AddBatchForm({ products, onCreate }: { products: Product[]; onCreate: (input: NewTicketBatch) => Promise<TicketBatch> }) {
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [allDishes, setAllDishes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleDish(id: string) {
    setSelectedDishes((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startNum = parseTicketInput(start);
    const endNum = parseTicketInput(end);

    if (!label.trim()) { setError('Give this batch a name (e.g. the event or client).'); return; }
    if (startNum === null || endNum === null) { setError('Ticket numbers must be digits only (up to 7).'); return; }
    if (endNum < startNum) { setError('The ending ticket must be the same or higher than the starting ticket.'); return; }
    if (!allDishes && selectedDishes.length === 0) { setError('Pick at least one dish, or choose "Any dish".'); return; }

    setSaving(true);
    setError('');
    try {
      await onCreate({
        label: label.trim(),
        ticketStart: startNum,
        ticketEnd: endNum,
        allowedProductIds: allDishes ? null : selectedDishes,
      });
      setLabel('');
      setStart('');
      setEnd('');
      setSelectedDishes([]);
      setAllDishes(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ticket batch');
    } finally {
      setSaving(false);
    }
  }

  const ticketCount = (() => {
    const s = parseTicketInput(start);
    const e = parseTicketInput(end);
    if (s === null || e === null || e < s) return null;
    return e - s + 1;
  })();

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="text-cream font-extrabold text-base">Add Event Ticket Batch</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Event / batch name</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Smith Wedding — July 20"
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-orange"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Ticket starts at</label>
          <input
            value={start}
            onChange={(e) => setStart(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
            placeholder="0000001"
            inputMode="numeric"
            className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream font-mono outline-none focus:border-orange"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Ticket ends at</label>
          <input
            value={end}
            onChange={(e) => setEnd(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
            placeholder="0000050"
            inputMode="numeric"
            className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream font-mono outline-none focus:border-orange"
          />
        </div>
      </div>
      {ticketCount !== null && (
        <p className="text-muted text-xs -mt-2">Covers {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}, inclusive of both ends.</p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Which dishes can these tickets redeem?</label>
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input type="checkbox" checked={allDishes} onChange={(e) => setAllDishes(e.target.checked)} />
          Any dish on the menu
        </label>
        {!allDishes && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 bg-base border border-border rounded-lg">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-xs text-cream-dim">
                <input type="checkbox" checked={selectedDishes.includes(p.id)} onChange={() => toggleDish(p.id)} />
                <span className="truncate">{p.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start px-4 py-2 rounded-lg bg-orange text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50"
      >
        {saving ? 'Saving…' : '+ Add Ticket Batch'}
      </button>
    </form>
  );
}

function BatchRow({ batch, redeemedCount, products, onToggleActive, onDelete }: {
  batch: TicketBatch;
  redeemedCount: number;
  products: Product[];
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const total = batch.ticketEnd - batch.ticketStart + 1;
  const dishLabel = !batch.allowedProductIds || batch.allowedProductIds.length === 0
    ? 'Any dish'
    : batch.allowedProductIds
        .map((id) => products.find((p) => p.id === id)?.name ?? id)
        .join(', ');

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-cream font-bold text-sm">{batch.label}</p>
          <p className="text-muted text-xs font-mono mt-0.5">
            {formatTicketNumber(batch.ticketStart)} – {formatTicketNumber(batch.ticketEnd)}
          </p>
        </div>
        <button
          onClick={onToggleActive}
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
            batch.active
              ? 'bg-[#1a3020] text-[#3da855] hover:bg-[#22402a]'
              : 'bg-[#3a1a10] text-[#d07060] hover:bg-[#4a2216]'
          }`}
        >
          {batch.active ? 'Active' : 'Disabled'}
        </button>
      </div>
      <p className="text-cream-dim text-xs">Valid for: {dishLabel}</p>
      <div className="flex items-center justify-between gap-3 mt-1">
        <p className="text-muted text-xs">{redeemedCount} of {total} tickets used</p>
        <button
          onClick={onDelete}
          className="text-[11px] font-bold uppercase tracking-wide text-muted hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function TicketBatchesPanel({ products }: Props) {
  const { ticketBatches, redeemedTickets, addTicketBatch, updateTicketBatch, deleteTicketBatch } = useOrderStore();

  const countFor = (batchId: string) => redeemedTickets.filter((t) => t.batchId === batchId).length;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
      <AddBatchForm products={products} onCreate={addTicketBatch} />

      <div className="flex flex-col gap-3">
        {ticketBatches.length === 0 && (
          <p className="text-muted text-sm px-1">No ticket batches yet. Add one above for your next event.</p>
        )}
        {ticketBatches.map((batch) => (
          <BatchRow
            key={batch.id}
            batch={batch}
            redeemedCount={countFor(batch.id)}
            products={products}
            onToggleActive={() => updateTicketBatch(batch.id, { active: !batch.active })}
            onDelete={() => {
              if (confirm(`Delete ticket batch "${batch.label}"? This cannot be undone.`)) deleteTicketBatch(batch.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

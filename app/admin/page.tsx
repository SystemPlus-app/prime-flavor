'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatsRow } from '@/components/admin/StatsRow';
import { OrderTable } from '@/components/admin/OrderTable';
import { Clock } from '@/components/shared/Clock';
import { PINGate } from '@/components/shared/PINGate';
import { useOrderStore } from '@/store/orderStore';
import { categories, products as allProducts, withAvailability, withPriceOverride, withImageOverride } from '@/data/primeFlavorMenu';
import type { Product } from '@/types/product';

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload image');
  const { url } = (await res.json()) as { url: string };
  return url;
}

type AdminTab = 'orders' | 'menu';

function EditablePrice({ price, onSave }: { price: number; onSave: (price: number) => void }) {
  const [value, setValue] = useState(price.toFixed(2));

  function commit() {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setValue(price.toFixed(2));
      return;
    }
    if (parsed !== price) onSave(parsed);
    setValue(parsed.toFixed(2));
  }

  return (
    <div className="flex items-center gap-1 font-bold text-orange">
      <span>$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="w-20 bg-transparent border-b border-transparent hover:border-border focus:border-orange outline-none text-orange font-bold"
      />
    </div>
  );
}

function PhotoCell({ image, onChange, onRemove }: { image?: string; onChange: (url: string) => void; onRemove: () => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      alert('Failed to upload image. Try a smaller file.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-base border border-border flex items-center justify-center shrink-0">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg opacity-40">🍽️</span>
        )}
      </div>
      <label className="text-[11px] font-bold uppercase tracking-wide text-muted hover:text-cream cursor-pointer">
        {uploading ? 'Uploading…' : image ? 'Change' : 'Add'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
      {image && (
        <button onClick={onRemove} className="text-[11px] font-bold uppercase tracking-wide text-muted hover:text-red-400">
          Remove
        </button>
      )}
    </div>
  );
}

function AddDishModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { name: string; category: string; price: number; description?: string; imageUrl?: string; popular: boolean }) => Promise<void> }) {
  const realCategories = categories.filter((c) => c.id !== 'featured');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(realCategories[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [popular, setPopular] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = Number.parseFloat(price);
    if (!name.trim()) { setError('Name is required'); return; }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { setError('Enter a valid price'); return; }

    setSaving(true);
    setError('');
    try {
      let imageUrl: string | undefined;
      if (file) imageUrl = await uploadImage(file);
      await onCreate({ name: name.trim(), category, price: parsedPrice, description: description.trim() || undefined, imageUrl, popular });
      onClose();
    } catch {
      setError('Failed to save dish. Try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <h3 className="text-cream font-extrabold text-lg">Add New Dish</h3>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-base border border-border flex items-center justify-center shrink-0">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl opacity-40">🍽️</span>
            )}
          </div>
          <label className="text-sm font-semibold text-orange cursor-pointer">
            Choose photo
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dish name"
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-orange"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-orange"
        >
          {realCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-orange"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-orange resize-none"
        />

        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} />
          Show in Featured tab
        </label>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted hover:text-cream text-sm font-bold uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-orange text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Dish'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const {
    orders, availability, visibility, priceOverrides, imageOverrides, customProducts,
    toggleAvailable, toggleVisible, updatePrice, updateImage, addCustomProduct, updateCustomProduct, deleteCustomProduct,
  } = useOrderStore();
  const [tab, setTab] = useState<AdminTab>('orders');
  const [showAddDish, setShowAddDish] = useState(false);
  const menuProducts: Product[] = withImageOverride(
    withPriceOverride(withAvailability([...allProducts, ...customProducts], availability), priceOverrides),
    imageOverrides,
  );

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      {/* top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-sidebar border-b border-border shrink-0">
        <div className="flex flex-col leading-none">
          <span className="text-orange font-extrabold text-base tracking-wide uppercase">Prime Flavor</span>
          <span className="text-muted text-[10px] tracking-widest uppercase">Admin Panel</span>
        </div>

        <div className="flex items-center gap-4">
          <Clock />
          <div className="flex items-center gap-2 ml-2">
            <Link
              href="/kitchen"
              className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors"
            >
              Kitchen
            </Link>
            <Link
              href="/kiosk"
              className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors"
            >
              Kiosk
            </Link>
          </div>
        </div>
      </header>

      {/* stats */}
      <StatsRow orders={orders} />

      {/* tab nav */}
      <div className="flex items-center gap-1 px-4 pb-2 shrink-0">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'orders' ? 'bg-orange text-white' : 'text-muted hover:text-cream'
          }`}
        >
          Order History
        </button>
        <button
          onClick={() => setTab('menu')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'menu' ? 'bg-orange text-white' : 'text-muted hover:text-cream'
          }`}
        >
          Menu Management
        </button>
      </div>

      {/* content */}
      {tab === 'orders' && <OrderTable orders={orders} />}

      {tab === 'menu' && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex justify-end py-3">
            <button
              onClick={() => setShowAddDish(true)}
              className="px-4 py-2 rounded-lg bg-orange text-white text-sm font-bold uppercase tracking-wide"
            >
              + Add New Dish
            </button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  {['Photo', 'Item', 'Category', 'Price', 'Status', 'Kiosk Menu', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-muted text-[11px] font-bold uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3">
                      <PhotoCell
                        image={p.image}
                        onChange={(url) => (p.custom ? updateCustomProduct(p.id, { imageUrl: url }) : updateImage(p.id, url))}
                        onRemove={() => (p.custom ? updateCustomProduct(p.id, { imageUrl: '' }) : updateImage(p.id, ''))}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-cream">{p.name}</td>
                    <td className="px-4 py-3 text-cream-dim capitalize">{p.category}</td>
                    <td className="px-4 py-3">
                      <EditablePrice key={p.price} price={p.price} onSave={(price) => updatePrice(p.id, price)} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailable(p.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                          p.available
                            ? 'bg-[#1a3020] text-[#3da855] hover:bg-[#22402a]'
                            : 'bg-[#3a1a10] text-[#d07060] hover:bg-[#4a2216]'
                        }`}
                      >
                        {p.available ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleVisible(p.id)}
                        title="Hide temporarily for events without pulling the item permanently"
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                          visibility[p.id] !== false
                            ? 'bg-[#1a2a3a] text-[#5ca3d0] hover:bg-[#20344a]'
                            : 'bg-[#332a1a] text-[#d0a35c] hover:bg-[#4a3a20]'
                        }`}
                      >
                        {visibility[p.id] !== false ? 'Shown' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {p.custom && (
                        <button
                          onClick={() => { if (confirm(`Remove "${p.name}" from the menu permanently?`)) deleteCustomProduct(p.id); }}
                          className="text-[11px] font-bold uppercase tracking-wide text-muted hover:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddDish && (
        <AddDishModal
          onClose={() => setShowAddDish(false)}
          onCreate={async (input) => { await addCustomProduct(input); }}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <PINGate routeLabel="Admin Dashboard">
      <AdminDashboard />
    </PINGate>
  );
}

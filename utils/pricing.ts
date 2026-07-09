const TAX_RATE = 0.1025; // Los Angeles (Venice Beach) sales tax

export function calcTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

export function calcTotal(subtotal: number): number {
  return Math.round((subtotal + calcTax(subtotal)) * 100) / 100;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

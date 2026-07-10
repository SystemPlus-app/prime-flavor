import type { Product, Category } from '@/types/product';

export const categories: Category[] = [
  { id: 'featured',   name: 'Featured',   icon: '⭐' },
  { id: 'skewers',    name: 'Skewers',    icon: '🍢' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
  { id: 'plates',     name: 'Plates',     icon: '🍽️' },
  { id: 'sides',      name: 'Sides',      icon: '🍞' },
  { id: 'salads',     name: 'Salads',     icon: '🥗' },
  { id: 'drinks',     name: 'Drinks',     icon: '🥤' },
];

export const products: Product[] = [
  // ── Skewers ───────────────────────────────────────────────────────────────
  {
    id: 'bbq-picanha-skewer',
    name: 'BBQ Picanha Skewer',
    category: 'skewers',
    price: 13,
    available: true,
    popular: true,
    description: 'Premium picanha grilled over open flame',
  },
  {
    id: 'bbq-sausage-skewer',
    name: 'BBQ Brazilian Sausage Skewer',
    category: 'skewers',
    price: 7,
    available: true,
    description: 'House-seasoned linguiça on skewer',
  },
  {
    id: 'bbq-chicken-skewer',
    name: 'BBQ Chicken Skewer',
    category: 'skewers',
    price: 7,
    available: true,
    description: 'Tender marinated chicken, flame grilled',
  },
  {
    id: 'bbq-chicken-bacon-skewer',
    name: 'BBQ Chicken Bacon Skewer',
    category: 'skewers',
    price: 8,
    available: true,
    description: 'Juicy chicken wrapped in crispy bacon',
  },
  {
    id: 'queijo-coalho-skewer',
    name: 'Queijo Coalho Skewer',
    category: 'skewers',
    price: 7,
    available: true,
    description: 'Grilled Brazilian cheese, lightly salted',
  },

  // ── Sandwiches ────────────────────────────────────────────────────────────
  {
    id: 'picanha-sandwich',
    name: 'Picanha Sandwich',
    category: 'sandwiches',
    price: 25,
    available: true,
    popular: true,
    description: 'Sliced picanha in artisan bread with signature sauce',
  },
  {
    id: 'picanha-cheese-bread',
    name: 'Picanha Cheese Bread Sandwich',
    category: 'sandwiches',
    price: 17,
    available: true,
    description: 'Picanha served in warm pão de queijo',
  },
  {
    id: 'chicken-bacon-sandwich',
    name: 'Chicken Bacon Sandwich',
    category: 'sandwiches',
    price: 16,
    available: true,
    description: 'Grilled chicken & bacon in toasted brioche',
  },
  {
    id: 'sausage-sandwich',
    name: 'Brazilian Sausage Sandwich',
    category: 'sandwiches',
    price: 15,
    available: true,
    description: 'Linguiça with peppers & onions',
  },
  {
    id: 'sausage-cheese-bread-sandwich',
    name: 'Sausage Cheese Bread Sandwich',
    category: 'sandwiches',
    price: 16,
    available: true,
    description: 'Linguiça in warm cheese bread',
  },
  {
    id: 'special-bbq-sandwich',
    name: 'Special Brazilian BBQ Sandwich',
    category: 'sandwiches',
    price: 22,
    available: true,
    popular: true,
    description: 'Mixed BBQ meats, roasted peppers & aioli',
  },

  // ── Plates ────────────────────────────────────────────────────────────────
  {
    id: 'bbq-picanha-plate',
    name: 'BBQ Picanha Plate',
    category: 'plates',
    price: 23,
    available: true,
    popular: true,
    description: 'Picanha with rice, beans & chimichurri',
  },
  {
    id: 'bbq-chicken-plate',
    name: 'BBQ Chicken Plate',
    category: 'plates',
    price: 18,
    available: true,
    description: 'Grilled chicken with rice & beans',
  },
  {
    id: 'bbq-chicken-bacon-plate',
    name: 'BBQ Chicken Bacon Plate',
    category: 'plates',
    price: 19,
    available: true,
    description: 'Chicken & bacon plate with rice & beans',
  },
  {
    id: 'bbq-sausage-plate',
    name: 'BBQ Brazilian Sausage Plate',
    category: 'plates',
    price: 18,
    available: true,
    description: 'Linguiça plate with rice & beans',
  },
  {
    id: 'prime-bbq-plate',
    name: 'Prime BBQ Plate',
    category: 'plates',
    price: 28,
    available: true,
    popular: true,
    description: 'Picanha, chicken & sausage — the works',
  },

  // ── Sides ─────────────────────────────────────────────────────────────────
  {
    id: 'cheese-bread-box',
    name: 'Cheese Bread Box',
    category: 'sides',
    price: 8,
    available: true,
    popular: true,
    description: '6 warm pão de queijo, fresh from the oven',
  },
  {
    id: 'garlic-bread',
    name: 'Garlic Bread',
    category: 'sides',
    price: 8,
    available: true,
    description: 'Toasted with herb garlic butter',
  },
  {
    id: 'potato-chips',
    name: 'Potato Chips',
    category: 'sides',
    price: 5,
    available: true,
    description: 'Crispy house-seasoned chips',
  },

  // ── Salads ────────────────────────────────────────────────────────────────
  {
    id: 'caesar-salad',
    name: 'Caesar Salad',
    category: 'salads',
    price: 10,
    available: true,
    description: 'Romaine, parmesan, croutons & caesar dressing',
  },

  // ── Drinks ────────────────────────────────────────────────────────────────
  {
    id: 'guarana',
    name: 'Guaraná Antarctica',
    category: 'drinks',
    price: 3.5,
    available: true,
    popular: true,
    description: "Brazil's iconic soft drink, ice cold",
  },
  {
    id: 'coke',
    name: 'Coke',
    category: 'drinks',
    price: 3.0,
    available: true,
    description: 'Classic Coca-Cola, refreshing',
  },
];

export const featuredIds = [
  'bbq-picanha-plate',
  'bbq-picanha-skewer',
  'picanha-sandwich',
  'special-bbq-sandwich',
  'cheese-bread-box',
];

export function getProductsByCategory(categoryId: string): Product[] {
  if (categoryId === 'featured') {
    return products.filter((p) => featuredIds.includes(p.id));
  }
  return products.filter((p) => p.category === categoryId);
}

export function withAvailability(list: Product[], overrides: Record<string, boolean>): Product[] {
  return list.map((p) => (p.id in overrides ? { ...p, available: overrides[p.id] } : p));
}

export function withPriceOverride(list: Product[], overrides: Record<string, number>): Product[] {
  return list.map((p) => (p.id in overrides ? { ...p, price: overrides[p.id] } : p));
}

export function withImageOverride(list: Product[], overrides: Record<string, string>): Product[] {
  return list.map((p) => (p.id in overrides ? { ...p, image: overrides[p.id] } : p));
}

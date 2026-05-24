export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description?: string;
  popular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

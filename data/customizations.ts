export interface CustomizationOption {
  id: string;
  label: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  label: string;
  multi: boolean;
  required?: boolean;
  options: CustomizationOption[];
}

const meatDoneness: CustomizationGroup = {
  id: 'doneness',
  label: 'Ponto da Carne',
  multi: false,
  required: true,
  options: [
    { id: 'mal-passado', label: 'Rare (Mal Passado)',      price: 0 },
    { id: 'ao-ponto',    label: 'Medium (Ao Ponto)',      price: 0 },
    { id: 'bem-passado', label: 'Well Done (Bem Passado)', price: 0 },
  ],
};

const heatLevel: CustomizationGroup = {
  id: 'heat',
  label: 'Heat Level',
  multi: false,
  required: true,
  options: [
    { id: 'mild',   label: 'Mild',   price: 0 },
    { id: 'medium', label: 'Medium', price: 0 },
    { id: 'spicy',  label: 'Spicy 🌶', price: 0 },
  ],
};

const plateSideChoice: CustomizationGroup = {
  id: 'plate-side-choice',
  label: 'Choose Side',
  multi: false,
  required: true,
  options: [
    { id: 'black-beans',   label: 'Black Beans',   price: 0 },
    { id: 'potato-chips',  label: 'Potato Chips',  price: 0 },
    { id: 'roasted-potato',label: 'Roasted Potato', price: 0 },
  ],
};

const plateExtras: CustomizationGroup = {
  id: 'plate-extras',
  label: 'Add Extras',
  multi: true,
  options: [
    { id: 'extra-rice',   label: 'Extra Rice',   price: 1 },
    { id: 'extra-beans',  label: 'Extra Beans',  price: 1 },
    { id: 'extra-farofa', label: 'Extra Farofa', price: 1 },
  ],
};

const plateMods: CustomizationGroup = {
  id: 'plate-mods',
  label: 'Remove',
  multi: true,
  options: [
    { id: 'no-rice',     label: 'No Rice',     price: 0 },
    { id: 'no-vinagrete', label: 'No Vinagrete', price: 0 },
    { id: 'no-farofa',   label: 'No Farofa',   price: 0 },
  ],
};

const breadChoice: CustomizationGroup = {
  id: 'bread-choice',
  label: 'Choose Bread',
  multi: false,
  required: true,
  options: [
    { id: 'ciabatta',    label: 'Ciabatta Bread', price: 0 },
    { id: 'french-roll', label: 'French Roll',    price: 0 },
  ],
};

const sandwichAddons: CustomizationGroup = {
  id: 'sandwich-addons',
  label: 'Add-ons',
  multi: true,
  options: [
    { id: 'extra-cheese',  label: 'Extra Cheese',   price: 1.5 },
    { id: 'extra-sauce',   label: 'Extra Sauce',     price: 0.5 },
    { id: 'add-fries',     label: 'Add Fries',       price: 3 },
    { id: 'add-guarana',   label: 'Add Guaraná',     price: 3.5 },
  ],
};

const sandwichMods: CustomizationGroup = {
  id: 'sandwich-mods',
  label: 'Remove',
  multi: true,
  options: [
    { id: 'no-swiss-cheese', label: 'No Swiss Cheese', price: 0 },
    { id: 'no-garlic-sauce', label: 'No Garlic Sauce', price: 0 },
    { id: 'no-vinagrete',    label: 'No Vinagrete',    price: 0 },
    { id: 'no-potato-chips', label: 'No Potato Chips', price: 0 },
  ],
};

const skewerAddons: CustomizationGroup = {
  id: 'skewer-addons',
  label: 'Add-ons',
  multi: true,
  options: [
    { id: 'extra-sauce',    label: 'Extra Sauce',    price: 0.5 },
    { id: 'add-bread',      label: 'Add Garlic Bread', price: 4 },
    { id: 'add-guarana',    label: 'Add Guaraná',     price: 3.5 },
  ],
};

const skewerMods: CustomizationGroup = {
  id: 'skewer-mods',
  label: 'Remove',
  multi: true,
  options: [
    { id: 'no-vinagrete', label: 'No Vinagrete', price: 0 },
    { id: 'no-farofa',    label: 'No Farofa',    price: 0 },
  ],
};

const saladAddons: CustomizationGroup = {
  id: 'salad-addons',
  label: 'Add-ons',
  multi: true,
  options: [
    { id: 'add-rice', label: 'Rice', price: 4 },
    { id: 'add-beans', label: 'Beans', price: 4 },
    { id: 'add-fried-plantains', label: 'Fried Plantains', price: 5 },
  ],
};

const saladMods: CustomizationGroup = {
  id: 'salad-mods',
  label: 'Remove',
  multi: true,
  options: [
    { id: 'no-spicy', label: 'No Spicy', price: 0 },
    { id: 'no-crispy-onions', label: 'No Crispy Onions', price: 0 },
    { id: 'no-parmesan', label: 'No Parmesan', price: 0 },
    { id: 'no-vinaigrette', label: 'No Vinaigrette', price: 0 },
    { id: 'no-garlic-sauce', label: 'No Garlic Sauce', price: 0 },
  ],
};

export const customizations: Record<string, CustomizationGroup[]> = {
  'bbq-picanha-plate':      [meatDoneness, plateSideChoice, plateExtras, plateMods],
  'bbq-chicken-plate':      [heatLevel, plateSideChoice, plateExtras, plateMods],
  'bbq-chicken-bacon-plate':[heatLevel, plateSideChoice, plateExtras, plateMods],
  'bbq-sausage-plate':      [plateSideChoice, plateExtras, plateMods],
  'prime-bbq-plate':        [meatDoneness, plateSideChoice, plateExtras, plateMods],

  'picanha-sandwich':              [breadChoice, meatDoneness, sandwichAddons, sandwichMods],
  'picanha-cheese-bread':          [meatDoneness, sandwichAddons, sandwichMods],
  'chicken-bacon-sandwich':        [breadChoice, heatLevel, sandwichAddons, sandwichMods],
  'chicken-sandwich':               [breadChoice, heatLevel, sandwichAddons, sandwichMods],
  'sausage-sandwich':               [breadChoice, sandwichAddons, sandwichMods],
  'sausage-cheese-bread-sandwich': [sandwichAddons, sandwichMods],
  'special-bbq-sandwich':          [breadChoice, meatDoneness, sandwichAddons, sandwichMods],

  'bbq-picanha-skewer':       [meatDoneness, skewerAddons, skewerMods],
  'bbq-chicken-skewer':       [heatLevel, skewerAddons, skewerMods],
  'bbq-chicken-bacon-skewer': [heatLevel, skewerAddons, skewerMods],
  'bbq-sausage-skewer':       [skewerAddons, skewerMods],
  'queijo-coalho-skewer':     [skewerAddons, skewerMods],
  'prime-mixed-skewers':      [meatDoneness, skewerAddons, skewerMods],

  'caesar-salad':          [saladAddons, saladMods],
  'classic-chicken-salad': [saladAddons, saladMods],
  'picanha-salad':         [meatDoneness, saladAddons, saladMods],
  'tropical-salad':        [saladAddons, saladMods],
  'chicken-bacon-salad':   [saladAddons, saladMods],
};

export function getCustomization(productId: string): CustomizationGroup[] | null {
  return customizations[productId] ?? null;
}

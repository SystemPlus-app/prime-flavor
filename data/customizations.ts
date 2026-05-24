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

const plateExtras: CustomizationGroup = {
  id: 'plate-extras',
  label: 'Add Extras',
  multi: true,
  options: [
    { id: 'extra-rice',        label: 'Extra Rice',        price: 1 },
    { id: 'extra-beans',       label: 'Extra Beans',       price: 1 },
    { id: 'extra-farofa',      label: 'Extra Farofa',      price: 1 },
    { id: 'extra-chimichurri', label: 'Extra Chimichurri', price: 0.5 },
  ],
};

const plateMods: CustomizationGroup = {
  id: 'plate-mods',
  label: 'Remove',
  multi: true,
  options: [
    { id: 'no-rice',    label: 'No Rice',    price: 0 },
    { id: 'no-beans',   label: 'No Beans',   price: 0 },
    { id: 'no-farofa',  label: 'No Farofa',  price: 0 },
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
    { id: 'no-onion',   label: 'No Onion',   price: 0 },
    { id: 'no-sauce',   label: 'No Sauce',   price: 0 },
    { id: 'no-lettuce', label: 'No Lettuce', price: 0 },
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

export const customizations: Record<string, CustomizationGroup[]> = {
  'bbq-picanha-plate':      [meatDoneness, plateExtras, plateMods],
  'bbq-chicken-plate':      [heatLevel, plateExtras, plateMods],
  'bbq-chicken-bacon-plate':[heatLevel, plateExtras, plateMods],
  'bbq-sausage-plate':      [plateExtras, plateMods],
  'prime-bbq-plate':        [meatDoneness, plateExtras, plateMods],

  'picanha-sandwich':              [meatDoneness, sandwichAddons, sandwichMods],
  'picanha-cheese-bread':          [meatDoneness, sandwichAddons, sandwichMods],
  'chicken-bacon-sandwich':        [heatLevel, sandwichAddons, sandwichMods],
  'sausage-sandwich':              [sandwichAddons, sandwichMods],
  'sausage-cheese-bread-sandwich': [sandwichAddons, sandwichMods],
  'special-bbq-sandwich':          [meatDoneness, sandwichAddons, sandwichMods],

  'bbq-picanha-skewer':       [meatDoneness, skewerAddons],
  'bbq-chicken-skewer':       [heatLevel, skewerAddons],
  'bbq-chicken-bacon-skewer': [heatLevel, skewerAddons],
  'bbq-sausage-skewer':       [skewerAddons],
};

export function getCustomization(productId: string): CustomizationGroup[] | null {
  return customizations[productId] ?? null;
}

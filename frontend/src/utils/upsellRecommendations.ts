import type { CartLine, Product } from "../types";

type UpsellRule = {
  source: string[];
  targets: string[];
  reason: (sourceName: string) => string;
};

export type UpsellRecommendation = {
  sourceProduct: Product;
  product: Product;
  reason: string;
};

const aiUsedKey = "smartmenuai_ai_add_used";
const shownUpsellProductsKey = "smartmenuai_shown_upsell_products";

const rules: UpsellRule[] = [
  { source: ["espresso"], targets: ["brownie"], reason: (name) => `Brownie sa výborne hodí k výraznej chuti ${name}.` },
  { source: ["americano"], targets: ["cheesecake"], reason: (name) => `Cheesecake pekne doplní jemnú chuť ${name}.` },
  { source: ["cappuccino"], targets: ["cheesecake"], reason: (name) => `Cheesecake sa výborne hodí ku ${name}.` },
  { source: ["latte"], targets: ["tiramisu"], reason: (name) => `Tiramisu dobre doplní mliečnu chuť ${name}.` },
  { source: ["flat white"], targets: ["brownie"], reason: (name) => `Brownie sa hodí k výraznejšej kávovej chuti ${name}.` },
  { source: ["ľadová káva", "ladova kava"], targets: ["panna cotta", "cheesecake"], reason: (name) => `Ľahší dezert sa hodí k osviežujúcej chuti ${name}.` },
  { source: ["čaj", "caj"], targets: ["jablkový koláč", "jablkovy kolac", "panna cotta"], reason: (name) => `Jemný dezert sa dobre hodí k ${name}.` },

  { source: ["mojito"], targets: ["cheesecake", "panna cotta"], reason: (name) => `Ľahší dezert dobre doplní sviežu chuť ${name}.` },
  { source: ["aperol spritz"], targets: ["tiramisu", "panna cotta"], reason: (name) => `Jemný dezert dobre doplní chuť ${name}.` },
  { source: ["gin tonic"], targets: ["panna cotta", "cheesecake"], reason: (name) => `Ľahký dezert sa hodí k sviežej chuti ${name}.` },
  { source: ["piña colada", "pina colada"], targets: ["tiramisu", "panna cotta"], reason: (name) => `Krémový dezert dobre doplní tropickú chuť ${name}.` },
  { source: ["sex on the beach"], targets: ["cheesecake", "panna cotta"], reason: (name) => `Jemný dezert dobre doplní ovocnú chuť ${name}.` },
  { source: ["blue lagoon"], targets: ["panna cotta", "cheesecake"], reason: (name) => `Ľahší dezert sa hodí k sviežej chuti ${name}.` },

  { source: ["pivo", "pilsner", "kozel"], targets: ["radler"], reason: (name) => `Ak chcete niečo ľahšie, skúste k ${name} aj Radler.` },
  { source: ["radler"], targets: ["nealko pivo"], reason: (name) => `Ak chcete pokračovať ľahšie, môžete skúsiť aj nealko pivo.` },

  { source: ["cheesecake"], targets: ["cappuccino", "latte"], reason: (name) => `Káva sa výborne hodí ku ${name}.` },
  { source: ["brownie"], targets: ["espresso", "flat white"], reason: (name) => `Výrazná káva dobre doplní chuť ${name}.` },
  { source: ["tiramisu"], targets: ["latte", "cappuccino"], reason: (name) => `Mliečna káva sa dobre hodí ku ${name}.` },
  { source: ["panna cotta"], targets: ["latte", "cappuccino"], reason: (name) => `Jemná káva dobre doplní chuť ${name}.` },
  { source: ["jablkový koláč", "jablkovy kolac"], targets: ["čaj", "caj", "cappuccino"], reason: (name) => `Teplý nápoj sa hodí ku ${name}.` }
];

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesName(product: Product, keywords: string[]) {
  const name = normalize(product.name);
  return keywords.some((keyword) => name.includes(normalize(keyword)));
}

function readSessionSet(key: string) {
  return new Set(JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[]);
}

function writeSessionSet(key: string, values: Set<string>) {
  sessionStorage.setItem(key, JSON.stringify([...values]));
}

export function markAiRecommendationUsed() {
  sessionStorage.setItem(aiUsedKey, "true");
}

export function wasAiRecommendationUsed() {
  return sessionStorage.getItem(aiUsedKey) === "true";
}

export function getShownUpsellProductIds() {
  return readSessionSet(shownUpsellProductsKey);
}

export function markUpsellProductShown(productId: string) {
  const shown = getShownUpsellProductIds();
  shown.add(productId);
  writeSessionSet(shownUpsellProductsKey, shown);
}

function findRecommendationForSource({
  sourceProduct,
  products,
  cart,
  blockedProductIds
}: {
  sourceProduct: Product;
  products: Product[];
  cart: CartLine[];
  blockedProductIds: Set<string>;
}): UpsellRecommendation | null {
  const rule = rules.find((candidate) => matchesName(sourceProduct, candidate.source));
  if (!rule) return null;

  const cartProductIds = new Set(cart.map((line) => line.product.id));
  const recommendedProduct = products.find(
    (product) => product.available && !cartProductIds.has(product.id) && !blockedProductIds.has(product.id) && matchesName(product, rule.targets)
  );

  if (!recommendedProduct) return null;

  return {
    sourceProduct,
    product: recommendedProduct,
    reason: rule.reason(sourceProduct.name)
  };
}

export function getUpsellRecommendation({
  addedProduct,
  products,
  cart,
  alreadyShownSourceIds = new Set<string>()
}: {
  addedProduct: Product;
  products: Product[];
  cart: CartLine[];
  alreadyShownSourceIds?: Set<string>;
}): UpsellRecommendation | null {
  if (alreadyShownSourceIds.has(addedProduct.id)) return null;

  return findRecommendationForSource({
    sourceProduct: addedProduct,
    products,
    cart,
    blockedProductIds: new Set()
  });
}

export function getCartRecommendation({
  products,
  cart
}: {
  products: Product[];
  cart: CartLine[];
}): UpsellRecommendation | null {
  for (const line of cart) {
    const recommendation = findRecommendationForSource({
      sourceProduct: line.product,
      products,
      cart,
      blockedProductIds: new Set()
    });

    if (recommendation) return recommendation;
  }

  return null;
}

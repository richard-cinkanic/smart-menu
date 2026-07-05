import { useMemo, useState } from "react";
import { ConciergeBell, Sparkles, X } from "lucide-react";
import type { Product } from "../types";
import { readGuestOrderHistory } from "../utils/guestStorage";

type MainChoice =
  | "coffee"
  | "fresh"
  | "sweet"
  | "nonAlcoholic"
  | "cocktail"
  | "dessert"
  | "warm"
  | "surprise";

type SubChoice = string;

type ChoiceConfig = {
  id: MainChoice;
  label: string;
  icon: string;
  question?: string;
  subchoices?: Array<{ id: SubChoice; label: string; icon?: string }>;
};

type Recommendation = {
  product: Product;
  reason: string;
};

type StoredOrder = {
  id: string;
  createdAt: string;
  totalPrice: number;
  itemCount: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

type RepeatOrderLine = {
  product: Product;
  quantity: number;
};

type AddToCartSource = "menu" | "ai" | "lastOrder" | "cartRecommendation";
type AddToCartOptions = { source?: AddToCartSource; showUpsell?: boolean };

const choices: ChoiceConfig[] = [
  {
    id: "coffee",
    label: "Káva",
    icon: "☕",
    question: "Akú kávu chcete?",
    subchoices: [
      { id: "strong", label: "Silná", icon: "⚡" },
      { id: "milk", label: "Mliečna", icon: "🥛" },
      { id: "gentle", label: "Jemná", icon: "☁️" },
      { id: "cold", label: "Ľadová", icon: "🧊" }
    ]
  },
  {
    id: "fresh",
    label: "Svieže",
    icon: "🍹",
    question: "Aký štýl sviežosti?",
    subchoices: [
      { id: "noAlcohol", label: "Bez alkoholu", icon: "🥤" },
      { id: "withAlcohol", label: "S alkoholom", icon: "🍸" },
      { id: "citrus", label: "Citrusové", icon: "🍋" },
      { id: "fruit", label: "Ovocné", icon: "🍓" }
    ]
  },
  {
    id: "sweet",
    label: "Sladké",
    icon: "🍯",
    question: "Na čo sladké máte chuť?",
    subchoices: [
      { id: "coffee", label: "Káva", icon: "☕" },
      { id: "dessert", label: "Dezert", icon: "🍰" },
      { id: "drink", label: "Drink", icon: "🍹" },
      { id: "light", label: "Niečo ľahké", icon: "☁️" }
    ]
  },
  {
    id: "nonAlcoholic",
    label: "Nealko",
    icon: "🥤",
    question: "Čo bez alkoholu?",
    subchoices: [
      { id: "lemonade", label: "Limonáda", icon: "🍋" },
      { id: "mocktail", label: "Mocktail", icon: "🍹" },
      { id: "tea", label: "Čaj", icon: "🍵" },
      { id: "classic", label: "Klasika", icon: "🥤" }
    ]
  },
  {
    id: "cocktail",
    label: "Miešaný nápoj",
    icon: "🍸",
    question: "Aký miešaný nápoj?",
    subchoices: [
      { id: "refreshing", label: "Osviežujúci", icon: "🧊" },
      { id: "sweet", label: "Sladký", icon: "🍯" },
      { id: "classic", label: "Klasika", icon: "🍸" },
      { id: "tropical", label: "Tropický", icon: "🌴" }
    ]
  },
  {
    id: "dessert",
    label: "Dezert",
    icon: "🍰",
    question: "Aký dezert?",
    subchoices: [
      { id: "chocolate", label: "Čokoládový", icon: "🍫" },
      { id: "fruit", label: "Ovocný", icon: "🍓" },
      { id: "creamy", label: "Krémový", icon: "🍮" },
      { id: "light", label: "Ľahký", icon: "☁️" }
    ]
  },
  {
    id: "warm",
    label: "Teplé",
    icon: "🔥",
    question: "Čo teplé?",
    subchoices: [
      { id: "coffee", label: "Káva", icon: "☕" },
      { id: "tea", label: "Čaj", icon: "🍵" },
      { id: "milk", label: "Mliečne", icon: "🥛" },
      { id: "gentle", label: "Niečo jemné", icon: "☁️" }
    ]
  },
  { id: "surprise", label: "Prekvapte ma", icon: "✨" }
];

function normalize(value = "") {
  return value.toLowerCase();
}

function productText(product: Product) {
  return normalize(`${product.name} ${product.description} ${product.category?.name ?? ""}`);
}

function category(product: Product) {
  return normalize(product.category?.name ?? "");
}

function matchesAny(product: Product, words: string[]) {
  const text = productText(product);
  return words.some((word) => text.includes(normalize(word)));
}

function stableSort(products: Product[]) {
  return [...products].sort((a, b) => a.name.localeCompare(b.name, "sk"));
}

function dailyRotate(products: Product[]) {
  if (products.length <= 1) return products;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const start = dayIndex % products.length;
  return [...products.slice(start), ...products.slice(0, start)];
}

function uniqueProducts(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function buildRecommendations(candidates: Product[], fallback: Product[], reason: string, limit = 3): Recommendation[] {
  const pool = uniqueProducts(candidates.length > 0 ? candidates : fallback);
  return stableSort(pool)
    .slice(0, limit)
    .map((product) => ({ product, reason }));
}

function pickProducts(
  products: Product[],
  mainChoice: MainChoice,
  subChoice?: SubChoice,
  excludedProductIds: string[] = []
): Recommendation[] {
  const excluded = new Set(excludedProductIds);
  const available = products.filter((product) => product.available && !excluded.has(product.id));
  if (available.length === 0) return [];

  const fromCategory = (name: string) => available.filter((product) => category(product).includes(normalize(name)));
  const byWords = (words: string[]) => available.filter((product) => matchesAny(product, words));
  const recommend = (candidates: Product[], reason: string, limit = 3) => buildRecommendations(candidates, available, reason, limit);
  const recommendFrom = (candidates: Product[], fallback: Product[], reason: string, limit = 3) =>
    buildRecommendations(candidates, fallback, reason, limit);

  if (mainChoice === "surprise") {
    return dailyRotate(stableSort(available))
      .slice(0, 3)
      .map((product) => ({
        product,
        reason: "Vybrali sme niečo z aktuálnej ponuky, čo sa hodí na rýchle rozhodnutie."
      }));
  }

  if (mainChoice === "coffee") {
    if (subChoice === "strong") return recommend(byWords(["double espresso", "espresso", "flat white"]), "Chceli ste silnú kávu, preto odporúčame výraznejšiu voľbu.");
    if (subChoice === "milk") return recommend(byWords(["cappuccino", "latte", "flat white"]), "Chceli ste mliečnu kávu s jemnejšou chuťou.");
    if (subChoice === "gentle") return recommend(byWords(["americano", "latte"]), "Hľadali ste jemnejšiu kávu na pomalé popíjanie.");
    if (subChoice === "cold") return recommend(byWords(["ľadová", "iced"]), "Chceli ste studenú kávu na osvieženie.");
    return recommend(fromCategory("káva"), "Vybrali sme odporúčanie z kávovej ponuky.");
  }

  if (mainChoice === "fresh") {
    if (subChoice === "withAlcohol") return recommend(byWords(["mojito", "aperol", "gin tonic", "tequila sunrise", "blue lagoon"]), "Chceli ste svieži drink s alkoholom.");
    if (subChoice === "citrus") return recommend(byWords(["citrón", "limet", "lemonade", "tonic", "sprite", "mojito"]), "Vybrali sme citrusovo sviežu voľbu.");
    if (subChoice === "fruit") return recommend(byWords(["mango", "strawberry", "fresh", "ovoc", "pomaranč", "tropical"]), "Chceli ste niečo ovocné a svieže.");
    return recommend(byWords(["virgin", "limonáda", "lemonade", "fresh", "tonic"]), "Chceli ste sviežu voľbu bez alkoholu.");
  }

  if (mainChoice === "sweet") {
    if (subChoice === "coffee") return recommend(byWords(["latte", "ľadová káva", "cappuccino"]), "Vybrali sme sladší kávový štýl.");
    if (subChoice === "dessert") return recommend(fromCategory("dezerty"), "Chceli ste niečo sladké po jedle alebo ku káve.");
    if (subChoice === "drink") return recommend(byWords(["piña colada", "sex on the beach", "shirley", "tropical", "mango"]), "Chceli ste sladší nápoj alebo drink.");
    return recommend(byWords(["panna cotta", "jablkový", "ovoc", "fruit", "latte"]), "Vybrali sme ľahšiu sladkú voľbu.");
  }

  if (mainChoice === "nonAlcoholic") {
    if (subChoice === "lemonade") return recommend(byWords(["limonáda", "lemonade", "fresh"]), "Chceli ste osviežujúcu limonádu bez alkoholu.");
    if (subChoice === "mocktail") return recommend(fromCategory("nealkoholické miešané"), "Vybrali sme nealkoholický miešaný nápoj.");
    if (subChoice === "tea") return recommend(fromCategory("čaje"), "Chceli ste čaj alebo pokojnejšiu nealko voľbu.");
    return recommend(fromCategory("nealkoholické nápoje"), "Vybrali sme klasický nealkoholický nápoj.");
  }

  if (mainChoice === "cocktail") {
    if (subChoice === "refreshing") return recommend(byWords(["mojito", "aperol", "gin tonic", "blue lagoon"]), "Chceli ste osviežujúci miešaný nápoj.");
    if (subChoice === "sweet") return recommend(byWords(["piña colada", "sex on the beach", "tequila sunrise"]), "Vybrali sme sladší miešaný nápoj.");
    if (subChoice === "tropical") return recommend(byWords(["piña colada", "tequila sunrise", "sex on the beach", "tropical"]), "Chceli ste tropickú chuť.");
    return recommend(fromCategory("miešané nápoje"), "Vybrali sme klasiku z miešaných nápojov.");
  }

  if (mainChoice === "dessert") {
    const desserts = fromCategory("dezerty");
    const dessertByWords = (words: string[]) => desserts.filter((product) => matchesAny(product, words));
    if (subChoice === "chocolate") return recommendFrom(dessertByWords(["brownie", "čokolád"]), desserts, "Chceli ste čokoládový dezert.");
    if (subChoice === "fruit") return recommendFrom(dessertByWords(["jablkový", "panna cotta", "ovoc", "fruit"]), desserts, "Vybrali sme ovocnejší dezert.");
    if (subChoice === "creamy") return recommendFrom(dessertByWords(["cheesecake", "tiramisu", "panna cotta", "krém"]), desserts, "Chceli ste krémový dezert.");
    return recommendFrom(dessertByWords(["panna cotta", "jablkový", "cheesecake"]), desserts, "Vybrali sme ľahší dezert.");
  }

  if (mainChoice === "warm") {
    if (subChoice === "tea") return recommend(fromCategory("čaje"), "Chceli ste teplý čaj.");
    if (subChoice === "milk") return recommend(byWords(["latte", "cappuccino", "flat white"]), "Chceli ste teplú mliečnu voľbu.");
    if (subChoice === "gentle") return recommend(byWords(["latte", "cappuccino", "mätový", "ovocný", "zelený", "americano"]), "Vybrali sme jemnejšiu teplú voľbu.");
    return recommend(fromCategory("káva"), "Vybrali sme teplú kávu.");
  }

  return recommend(available, "Vybrali sme odporúčanie z dostupnej ponuky.");
}

export default function AiRecommendationWidget({
  products,
  cartProductIds = [],
  onAdd,
  onOpenChange,
  hideBubble = false,
  bubbleText = "Na čo máte chuť?"
}: {
  products: Product[];
  cartProductIds?: string[];
  onAdd: (product: Product, quantity?: number, options?: AddToCartOptions) => void;
  onOpenChange?: (isOpen: boolean) => void;
  hideBubble?: boolean;
  bubbleText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mainChoice, setMainChoice] = useState<ChoiceConfig | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRepeatOrderHidden, setIsRepeatOrderHidden] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const availableProducts = useMemo(() => products.filter((product) => product.available), [products]);
  const visibleProducts = useMemo(
    () => availableProducts.filter((product) => !cartProductIds.includes(product.id)),
    [availableProducts, cartProductIds]
  );
  const repeatOrderLines = useMemo<RepeatOrderLine[]>(() => {
    const [lastOrder] = readGuestOrderHistory<StoredOrder>();
    if (!lastOrder?.items?.length) return [];

    return lastOrder.items
      .map((item) => {
        const product = availableProducts.find((availableProduct) => availableProduct.name === item.name);
        if (!product) return null;
        return { product, quantity: item.quantity };
      })
      .filter((line): line is RepeatOrderLine => Boolean(line));
  }, [availableProducts]);
  const repeatOrderSummary = useMemo(
    () => repeatOrderLines.map((line) => `${line.quantity}× ${line.product.name}`).join(", "),
    [repeatOrderLines]
  );

  if (availableProducts.length === 0) return null;

  function resetFlow() {
    setMainChoice(null);
    setRecommendations([]);
    setConfirmationText("");
  }

  function updateOpen(nextOpen: boolean) {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function selectMainChoice(choice: ChoiceConfig) {
    setConfirmationText("");
    if (choice.id === "surprise") {
      setMainChoice(null);
      setRecommendations(pickProducts(availableProducts, choice.id, undefined, cartProductIds));
      return;
    }

    setMainChoice(choice);
    setRecommendations([]);
  }

  function selectSubChoice(subChoice: SubChoice) {
    if (!mainChoice) return;
    setConfirmationText("");
    setRecommendations(pickProducts(availableProducts, mainChoice.id, subChoice, cartProductIds));
  }

  const hasRecommendations = recommendations.length > 0;
  const noRecommendationAvailable = visibleProducts.length === 0;

  return (
    <div className="ai-widget-container">
      {isOpen && (
        <div className="ai-widget-popover">
          <button
            className="ai-widget-close"
            onClick={() => {
              updateOpen(false);
              resetFlow();
            }}
            title="Zavrieť pomocníka"
            aria-label="Zavrieť pomocníka"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="ai-widget-content">
            <div className="ai-widget-title-badge">
              <ConciergeBell className="w-3.5 h-3.5" />
              <span>Pomocník pri výbere</span>
            </div>

            {confirmationText && <div className="ai-inline-confirmation">{confirmationText}</div>}

            {!mainChoice && !hasRecommendations && !noRecommendationAvailable && (
              <>
                {repeatOrderLines.length > 0 && !isRepeatOrderHidden && (
                  <div className="ai-repeat-order-card">
                    <button
                      type="button"
                      className="ai-repeat-order-close"
                      onClick={() => setIsRepeatOrderHidden(true)}
                      aria-label="Skryť poslednú objednávku"
                      title="Skryť poslednú objednávku"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span>Vaša posledná objednávka</span>
                    <strong>Dáte si to čo minule?</strong>
                    <p>{repeatOrderSummary}</p>
                    <button
                      type="button"
                      onClick={() => {
                        repeatOrderLines.forEach((line) => onAdd(line.product, line.quantity, { source: "lastOrder", showUpsell: false }));
                        updateOpen(false);
                        resetFlow();
                      }}
                    >
                      Pridať znova
                    </button>
                  </div>
                )}

                <span className="ai-widget-question">Na čo máte chuť?</span>
                <p className="ai-widget-helper-text">Vyberte, na čo máte chuť, a my Vám odporučíme niečo z nášho menu.</p>

                <div className="ai-choice-grid">
                  {choices
                    .filter((choice) => choice.id !== "surprise")
                    .map((choice) => (
                      <button key={choice.id} type="button" className="ai-choice-chip" onClick={() => selectMainChoice(choice)}>
                        <span className="ai-choice-icon" aria-hidden="true">{choice.icon}</span>
                        <span>{choice.label}</span>
                      </button>
                    ))}
                </div>

                <button
                  type="button"
                  className="ai-surprise-btn"
                  onClick={() => selectMainChoice(choices.find((choice) => choice.id === "surprise")!)}
                >
                  ✨ Prekvapte ma
                </button>
              </>
            )}

            {mainChoice && !hasRecommendations && !noRecommendationAvailable && (
              <>
                <span className="ai-widget-question">{mainChoice.question}</span>
                <p className="ai-widget-helper-text">Ešte jeden výber a pripravíme konkrétne odporúčania.</p>

                <div className="ai-choice-grid">
                  {mainChoice.subchoices?.map((choice) => (
                    <button key={choice.id} type="button" className="ai-choice-chip" onClick={() => selectSubChoice(choice.id)}>
                      {choice.icon && <span className="ai-choice-icon" aria-hidden="true">{choice.icon}</span>}
                      <span>{choice.label}</span>
                    </button>
                  ))}
                </div>

                <button type="button" className="ai-widget-secondary-btn" onClick={resetFlow}>Späť</button>
              </>
            )}

            {hasRecommendations && (
              <div className="ai-recommendation-result">
                <span className="ai-widget-question">Odporúčame Vám</span>
                <p className="ai-widget-helper-text">{recommendations[0].reason}</p>

                <div className="ai-recommendation-list">
                  {recommendations.map((recommendation) => (
                    <div className="ai-recommendation-card" key={recommendation.product.id}>
                      <div>
                        <h3>{recommendation.product.name}</h3>
                      </div>
                      <button
                        className="ai-widget-add-btn"
                        onClick={() => {
                          onAdd(recommendation.product, 1, { source: "ai", showUpsell: false });
                          setConfirmationText(`${recommendation.product.name} pridané do košíka`);
                          setRecommendations((current) => current.filter((item) => item.product.id !== recommendation.product.id));
                        }}
                      >
                        Pridať za {recommendation.product.price.toFixed(2)} €
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className="ai-widget-secondary-btn" onClick={resetFlow}>Skúsiť iné</button>
              </div>
            )}

            {noRecommendationAvailable && (
              <div className="ai-recommendation-result">
                <span className="ai-widget-question">Všetko už máte v košíku</span>
                <p>Nemáme ďalšie dostupné odporúčania mimo položiek, ktoré už máte vybrané.</p>
                <button type="button" className="ai-widget-secondary-btn" onClick={resetFlow}>Späť</button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isOpen && !hideBubble && <div className="ai-widget-bubble">{bubbleText}</div>}

      <button
        className="ai-widget-trigger-btn"
        onClick={() => updateOpen(!isOpen)}
        title="Pomocník pri výbere"
        aria-label="Otvoriť pomocníka pri výbere"
      >
        <ConciergeBell className="w-6 h-6" />
        <Sparkles className="ai-widget-sparkle" />
      </button>
    </div>
  );
}

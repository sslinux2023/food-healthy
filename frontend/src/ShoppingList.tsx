import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ShoppingItemRow, { ShoppingItem } from "./components/ShoppingItemRow";
import AddItemModal from "./components/AddItemModal";

type ShoppingListProps = {
  token: string;
  userKey: string;
  onBack: () => void;
  onSessionExpired: () => void;
};

const BASE_STORAGE_KEY = "food-healthy:user-shopping-items";

const BASE_ITEMS: ShoppingItem[] = [
  // Breakfast
  { id: "b1", name: "Oats", quantity: 200, unit: "g", category: "Breakfast", checked: false, note: "For Oatmeal with Fruits" },
  { id: "b2", name: "Milk", quantity: 627, unit: "ml", category: "Breakfast", checked: false, note: "For Oatmeal with Fruits" },
  { id: "b3", name: "Bananas", quantity: 4.2, unit: "pieces", category: "Breakfast", checked: false, note: "For Oatmeal with Fruits" },
  { id: "b4", name: "Almonds", quantity: 74.3, unit: "g", category: "Breakfast", checked: false, note: "For Oatmeal with Fruits" },
  { id: "b5", name: "Olive oil", quantity: 51.8, unit: "ml", category: "Breakfast", checked: false, note: "For Eggs with Khobz" },
  { id: "b6", name: "Eggs", quantity: 9.8, unit: "pieces", category: "Breakfast", checked: false, note: "For Eggs with Khobz" },
  { id: "b7", name: "Khobz bread", quantity: 396.1, unit: "g", category: "Breakfast", checked: false, note: "For Eggs with Khobz" },
  { id: "b8", name: "Cheese", quantity: 76.4, unit: "g", category: "Breakfast", checked: false, note: "For Harcha with Cheese" },
  // Lunch
  { id: "l1", name: "Chicken", quantity: 652.8, unit: "g", category: "Lunch", checked: false, note: "For Chicken Tagine with Olives" },
  { id: "l2", name: "Olives", quantity: 91, unit: "g", category: "Lunch", checked: false, note: "For Chicken Tagine with Olives" },
  { id: "l3", name: "Onion", quantity: 208.3, unit: "g", category: "Lunch", checked: false, note: "For Chicken Tagine" },
  { id: "l4", name: "Chicken breast", quantity: 1.3, unit: "kg", category: "Lunch", checked: false, note: "For Grilled Chicken Salad" },
  { id: "l5", name: "Fish", quantity: 768, unit: "g", category: "Lunch", checked: false, note: "For Grilled Fish with Rice" },
  { id: "l6", name: "Rice", quantity: 307.2, unit: "g", category: "Lunch", checked: false, note: "For Grilled Fish with Rice" },
  { id: "l7", name: "Potato", quantity: 315.5, unit: "g", category: "Lunch", checked: false, note: "For Vegetable Tagine" },
  { id: "l8", name: "Zucchini", quantity: 250.8, unit: "g", category: "Lunch", checked: false, note: "For Vegetable Tagine" },
  // Snack
  { id: "s1", name: "Apple", quantity: 2.9, unit: "pieces", category: "Snack", checked: false, note: "For Apple with Peanut Butter" },
  { id: "s2", name: "Peanut butter", quantity: 43.9, unit: "g", category: "Snack", checked: false, note: "For Apple with Peanut Butter" },
  { id: "s3", name: "Yogurt", quantity: 487.8, unit: "g", category: "Snack", checked: false, note: "For Greek Yogurt with Honey" },
  { id: "s4", name: "Honey", quantity: 94.7, unit: "g", category: "Snack", checked: false, note: "For Greek Yogurt with Honey" },
  { id: "s5", name: "Dates", quantity: 6.5, unit: "pieces", category: "Snack", checked: false, note: "For Mixed Nuts & Dates" },
  { id: "s6", name: "Walnuts", quantity: 32.9, unit: "g", category: "Snack", checked: false, note: "For Mixed Nuts & Dates" },
];

const CATEGORY_ORDER: ShoppingItem["category"][] = [
  "Added by you",
  "Breakfast",
  "Lunch",
  "Snack",
];

// Pure helper — reads from localStorage. Not a hook, so no warning.
function readUserItems(key: string): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ShoppingList({ userKey, onBack }: ShoppingListProps) {
  const { t } = useTranslation();

  const storageKey = `${BASE_STORAGE_KEY}:${userKey || "anonymous"}`;

  // Lazy initializer — no effect, no warning
  const [userItems, setUserItems] = useState<ShoppingItem[]>(() =>
    readUserItems(storageKey)
  );
  const [baseItems, setBaseItems] = useState<ShoppingItem[]>(BASE_ITEMS);
  const [modalOpen, setModalOpen] = useState(false);

  // Persist — writes to external system, so this effect is fine
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(userItems));
    } catch {}
  }, [userItems, storageKey]);

  const allItems = useMemo(
    () => [...userItems, ...baseItems],
    [userItems, baseItems]
  );

  const toggle = (id: string) => {
    if (userItems.some((it) => it.id === id)) {
      setUserItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
      );
      return;
    }
    setBaseItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const remove = (id: string) => {
    setUserItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addItem = (data: { name: string; quantity: number; unit: string }) => {
    const newItem: ShoppingItem = {
      id: `user-${Date.now()}`,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      category: "Added by you",
      checked: false,
    };
    setUserItems((prev) => [newItem, ...prev]);
  };

  const grouped = useMemo(() => {
    const map: Record<string, ShoppingItem[]> = {};
    for (const cat of CATEGORY_ORDER) map[cat] = [];
    for (const item of allItems) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [allItems]);

  const total = allItems.length;
  const done = allItems.filter((i) => i.checked).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const catLabel = (cat: string) => {
    if (cat === "Added by you") {
      return `➕ ${t("shoppingList.manualItems", { defaultValue: "Added by you" })}`;
    }
    return t(`shoppingList.categories.${cat}`, { defaultValue: cat });
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black hover:border-black"
            aria-label={t("shoppingList.back", { defaultValue: "Back" })}
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-black">
              {t("shoppingList.title", { defaultValue: "Shopping list" })}
            </h1>
            <p className="text-sm text-neutral-500">
              {t("shoppingList.familySize", {
                count: 1,
                defaultValue: "Quantities for 1 family members",
              })}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-black">
              {t("shoppingList.itemsProgress", {
                done,
                total,
                defaultValue: `${done} of ${total} items`,
              })}
            </span>
            <span className="text-sm font-semibold text-black">
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {CATEGORY_ORDER.map((cat) => {
          const list = grouped[cat];
          if (!list || list.length === 0) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black">
                {catLabel(cat)}
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggle={toggle}
                    onDelete={cat === "Added by you" ? remove : undefined}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white shadow-lg hover:bg-neutral-800"
          aria-label={t("shoppingList.addItem", { defaultValue: "Add item" })}
        >
          +
        </button>

        <AddItemModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={addItem}
        />
      </div>
    </div>
  );
}
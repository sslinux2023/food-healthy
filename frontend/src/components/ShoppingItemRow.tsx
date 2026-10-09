import { useTranslation } from "react-i18next";
import IngredientImage from "./IngredientImage";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: "Breakfast" | "Lunch" | "Snack" | "Added by you";
  checked: boolean;
  note?: string;
};

type Props = {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function ShoppingItemRow({ item, onToggle, onDelete }: Props) {
  const { t } = useTranslation();

  const unitLabel = t(`shoppingList.units.${item.unit}`, {
    defaultValue: item.unit,
  });

  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all
        ${item.checked
          ? "bg-neutral-100 border-neutral-200 opacity-60"
          : "bg-white border-neutral-200 hover:border-black hover:shadow-sm"}`}
    >
      <button
        onClick={() => onToggle(item.id)}
        aria-label={`Toggle ${item.name}`}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition
          ${item.checked
            ? "bg-black border-black text-white"
            : "bg-white border-neutral-400 hover:border-black"}`}
      >
        {item.checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <IngredientImage name={item.name} size={44} />

      <div className="flex-1 min-w-0">
        <p className={`truncate font-medium text-black ${item.checked ? "line-through" : ""}`}>
          {item.name}
        </p>
        {item.note && (
          <p className="truncate text-xs text-neutral-500">{item.note}</p>
        )}
      </div>

      <div className="text-right">
        <span className="text-sm font-semibold text-black">{item.quantity}</span>
        <span className="ml-1 text-xs text-neutral-500">{unitLabel}</span>
      </div>

      {onDelete && item.category === "Added by you" && (
        <button
          onClick={() => onDelete(item.id)}
          className="ml-2 opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-black"
          aria-label={t("shoppingList.remove", { defaultValue: "Remove" })}
        >
          ✕
        </button>
      )}
    </div>
  );
}
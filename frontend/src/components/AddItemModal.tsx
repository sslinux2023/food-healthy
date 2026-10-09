import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (item: { name: string; quantity: number; unit: string }) => void;
};

const UNITS = ["g", "ml", "pieces", "kg", "L", "tbsp", "tsp"];

export default function AddItemModal({ open, onClose, onAdd }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pieces");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), quantity, unit });
    setName("");
    setQuantity(1);
    setUnit("pieces");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200"
      >
        <h2 className="mb-1 text-xl font-bold text-black">
          {t("shoppingList.addModal.title", { defaultValue: "Add an item" })}
        </h2>
        <p className="mb-5 text-sm text-neutral-500">
          {t("shoppingList.addModal.subtitle", { defaultValue: "It will appear at the top of your list." })}
        </p>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("shoppingList.addModal.product", { defaultValue: "Product" })}
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("shoppingList.addModal.productPlaceholder", { defaultValue: "e.g. Olive oil" })}
          className="mb-4 w-full rounded-xl border border-neutral-300 px-4 py-3 text-black outline-none focus:border-black"
        />

        <div className="mb-5 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("shoppingList.addModal.quantity", { defaultValue: "Quantity" })}
            </label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-black outline-none focus:border-black"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("shoppingList.addModal.unit", { defaultValue: "Unit" })}
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-black outline-none focus:border-black bg-white"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`shoppingList.units.${u}`, { defaultValue: u })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            {t("shoppingList.addModal.cancel", { defaultValue: "Cancel" })}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            {t("shoppingList.addModal.add", { defaultValue: "Add to list" })}
          </button>
        </div>
      </form>
    </div>
  );
}
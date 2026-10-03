import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ListChecks, ShoppingBasket } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ShoppingSource {
  mealType: string;
  recipeName: string;
  dayOfWeek: number;
}

interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  isChecked: boolean;
  source: string;
  sources: ShoppingSource[];
}

interface ShoppingListResponse {
  weekPlanId: number;
  familyMembersCount: number;
  items: ShoppingItem[];
}

interface ShoppingListProps {
  token: string;
  onBack: () => void;
  onSessionExpired: () => void;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function ShoppingList({ token, onBack, onSessionExpired }: ShoppingListProps) {
  const { t } = useTranslation();
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualUnit, setManualUnit] = useState('piece');

  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      try {
        const response = await fetch(`${API}/shopping-list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const data = await readJson(response);
        if (!response.ok || !data) throw new Error(data?.message || t('shoppingList.loadError'));
        if (!cancelled) setShoppingList(data);
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : t('shoppingList.loadError'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchList();
    return () => {
      cancelled = true;
    };
  }, [token, t, onSessionExpired]);

  const toggleItem = async (item: ShoppingItem) => {
    setWorking(true);
    setError('');
    try {
      const response = await fetch(`${API}/shopping-list/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isChecked: !item.isChecked }),
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await readJson(response);
      if (!response.ok || !data) throw new Error(data?.message || t('shoppingList.updateError'));
      setShoppingList((current) => current
        ? { ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, isChecked: data.isChecked } : entry) }
        : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('shoppingList.updateError'));
    } finally {
      setWorking(false);
    }
  };

  const clearPurchased = async () => {
    setWorking(true);
    setError('');
    try {
      const response = await fetch(`${API}/shopping-list`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await readJson(response);
      if (!response.ok || !data) throw new Error(data?.message || t('shoppingList.clearError'));
      setShoppingList((current) => current
        ? { ...current, items: current.items.filter((item) => !item.isChecked) }
        : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('shoppingList.clearError'));
    } finally {
      setWorking(false);
    }
  };

  const addManualItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = manualName.trim();
    const qty = Number(manualQty);
    if (!name || !Number.isFinite(qty) || qty <= 0) return;

    setWorking(true);
    setError('');
    try {
      const response = await fetch(`${API}/shopping-list/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, qty, unit: manualUnit }),
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const item = await readJson(response);
      if (!response.ok || !item) throw new Error(item?.message || t('shoppingList.updateError'));
      setShoppingList((current) => current
        ? { ...current, items: [...current.items, item] }
        : { weekPlanId: 0, familyMembersCount: 1, items: [item] });
      setManualName('');
      setManualQty('1');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('shoppingList.updateError'));
    } finally {
      setWorking(false);
    }
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const visibleItems = shoppingList?.items ?? [];
  const checkedCount = visibleItems.filter((item) => item.isChecked).length;

  return (
    <main className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={t('shoppingList.back')}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-200 bg-white text-emerald-800 shadow-lg shadow-emerald-900/5 transition hover:bg-emerald-50"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5 rtl:rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-emerald-950">{t('shoppingList.title')}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {t('shoppingList.familySize', { count: shoppingList?.familyMembersCount ?? 1 })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void clearPurchased()}
            disabled={working || checkedCount === 0}
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-900/5 transition hover:bg-emerald-50 disabled:opacity-50"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            {t('shoppingList.clearPurchased')}
          </button>
        </header>

        {error && <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
        <form onSubmit={addManualItem} className="grid gap-2 rounded-2xl bg-white p-4 shadow-lg shadow-emerald-900/5 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]">
          <input
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
            required
            placeholder={t('shoppingList.manualPlaceholder')}
            aria-label={t('shoppingList.manualPlaceholder')}
            className="min-w-0 rounded-xl border border-emerald-100 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={manualQty}
            onChange={(event) => setManualQty(event.target.value)}
            aria-label={t('shoppingList.quantity')}
            className="rounded-xl border border-emerald-100 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <select
            value={manualUnit}
            onChange={(event) => setManualUnit(event.target.value)}
            aria-label={t('shoppingList.unit')}
            className="rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
          >
            <option value="g">{t('shoppingList.units.g')}</option>
            <option value="kg">{t('shoppingList.units.kg')}</option>
            <option value="piece">{t('shoppingList.units.piece')}</option>
            <option value="liter">{t('shoppingList.units.liter')}</option>
          </select>
          <button disabled={working} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {t('shoppingList.addItem')}
          </button>
        </form>
        {loading ? (
          <div className="space-y-4" aria-label={t('shoppingList.loading')}>
            {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-white shadow-lg shadow-emerald-900/5" />)}
          </div>
        ) : visibleItems.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-lg shadow-emerald-900/5">
            <ShoppingBasket aria-hidden="true" className="mx-auto h-9 w-9 text-emerald-600" />
            <p className="mt-3 font-semibold text-gray-900">{t('shoppingList.empty')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('shoppingList.emptyHint')}</p>
          </section>
        ) : (
          <div className="space-y-4">
            {mealTypes.map((mealType) => {
              const items = visibleItems.filter((item) => item.sources.some((source) => source.mealType === mealType));
              if (items.length === 0) return null;
              return (
                <section key={mealType} className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-emerald-900/5">
                  <h2 className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-900">
                    {t(`weekPlan.meals.${mealType}`)}
                  </h2>
                  <ul className="divide-y divide-gray-100 px-4">
                    {items.map((item) => (
                      <li key={`${mealType}-${item.id}`}>
                        <label className="flex cursor-pointer items-center gap-3 py-3 transition-colors hover:bg-emerald-50">
                          <input
                            type="checkbox"
                            checked={item.isChecked}
                            disabled={working}
                            onChange={() => void toggleItem(item)}
                            className="h-5 w-5 shrink-0 accent-emerald-600"
                          />
                          <span className={`min-w-0 flex-1 text-sm font-medium ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-emerald-800">
                            {Number.isInteger(item.quantity) ? item.quantity : Number(item.quantity.toFixed(1))} {t(`shoppingList.units.${item.unit}`, { defaultValue: item.unit })}
                          </span>
                        </label>
                        <p className="-mt-2 pb-2 ps-8 text-xs text-gray-500">
                          {t('shoppingList.usedFor', { recipes: [...new Set(item.sources.filter((source) => source.mealType === mealType).map((source) => source.recipeName))].join(', ') })}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            {visibleItems.some((item) => item.source === 'manual') && (
              <section className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-emerald-900/5">
                <h2 className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-900">
                  {t('shoppingList.manualItems')}
                </h2>
                <ul className="divide-y divide-gray-100 px-4">
                  {visibleItems.filter((item) => item.source === 'manual').map((item) => (
                    <li key={`manual-${item.id}`}>
                      <label className="flex cursor-pointer items-center gap-3 py-3 hover:bg-emerald-50">
                        <input type="checkbox" checked={item.isChecked} disabled={working} onChange={() => void toggleItem(item)} className="h-5 w-5 accent-emerald-600" />
                        <span className={`min-w-0 flex-1 text-sm font-medium ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.name}</span>
                        <span className="text-xs font-semibold text-emerald-800">{Number.isInteger(item.quantity) ? item.quantity : Number(item.quantity.toFixed(1))} {t(`shoppingList.units.${item.unit}`, { defaultValue: item.unit })}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="flex items-center gap-2 px-1 text-xs text-gray-500">
              <ListChecks aria-hidden="true" className="h-4 w-4" />
              {t('shoppingList.estimatedAmounts')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default ShoppingList;

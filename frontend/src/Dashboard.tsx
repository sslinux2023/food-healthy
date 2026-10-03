import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Apple,
  Droplet,
  Drumstick,
  Egg,
  Flame,
  Moon,
  Scale,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react';
import ShoppingList from './ShoppingList.tsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const recipeTranslationKeys: Record<string, string> = {
  'Moroccan Mint Tea & Msemen': 'mintTeaMsemen',
  'Harcha with Cheese': 'harchaCheese',
  'Oatmeal with Fruits': 'oatmealFruits',
  'Eggs with Khobz': 'eggsKhobz',
  'Chicken Tagine with Olives': 'chickenTagineOlives',
  'Couscous with Vegetables': 'couscousVegetables',
  'Grilled Fish with Rice': 'grilledFishRice',
  'Lentil Soup (Harira-style)': 'lentilSoup',
  'Grilled Chicken Salad': 'chickenSalad',
  'Harira Soup': 'hariraSoup',
  'Vegetable Tagine': 'vegetableTagine',
  'Grilled Chicken Breast': 'chickenBreast',
  'Zaalouk with Bread': 'zaaloukBread',
  'Mixed Nuts & Dates': 'nutsDates',
  'Fresh Orange Juice': 'orangeJuice',
  'Greek Yogurt with Honey': 'yogurtHoney',
  'Apple with Peanut Butter': 'applePeanutButter',
};

const mealIcons: Record<string, LucideIcon> = {
  breakfast: Egg,
  lunch: Drumstick,
  dinner: Moon,
  snack: Apple,
};

const revealVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, staggerChildren: 0.07 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

interface DashboardProps {
  user: {
    firstName: string;
    bmi?: number;
    dailyCalories?: number;
    tdee?: number;
    goal?: string;
    height?: number;
    weight?: number;
    idealWeightMax?: number;
    proteinGrams?: number;
    carbGrams?: number;
    fatGrams?: number;
  };
  onLogout: () => void;
  onSessionExpired: () => void;
  token?: string;
}

interface WeekPlanMeal {
  id: number;
  dayOfWeek: number;
  mealType: string;
  servings: number;
  reason?: string;
  recipe: {
    name: string;
    calories?: number | null;
    servingGrams: number;
    proteinGrams?: number | null;
    carbGrams?: number | null;
    fatGrams?: number | null;
    ingredients: string;
  };
}

interface WeekPlanResponse {
  id: number;
  meals: WeekPlanMeal[];
}

interface DailyCheckIn {
  date: string;
  dayOfWeek: number;
  waterGlasses: number;
  walkedMinutes: number;
  points: number;
  eatenMealIds: number[];
}

interface HealthScoreResponse {
  date: string;
  score: number;
  breakdown: { bmi: number; water: number; meals: number };
  waterMlDrunk: number;
  waterMlTarget: number;
  mealsCompleted: number;
  mealsTarget: number;
}

interface HealthScoreSnapshot {
  date: string;
  score: number;
  bmiPoints: number;
  waterPoints: number;
  mealsPoints: number;
}

interface RecipeIngredientDetail {
  name: string;
  qty: number;
  unit: string;
}

function parseRecipeIngredients(raw: string, servings: number): RecipeIngredientDetail[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): RecipeIngredientDetail[] => {
      if (typeof entry === 'string') return [{ name: entry, qty: servings, unit: 'portion' }];
      if (typeof entry !== 'object' || entry === null) return [];
      const ingredient = entry as Partial<RecipeIngredientDetail>;
      if (
        typeof ingredient.name !== 'string' ||
        typeof ingredient.qty !== 'number' ||
        typeof ingredient.unit !== 'string'
      ) return [];
      return [{ name: ingredient.name, qty: ingredient.qty * servings, unit: ingredient.unit }];
    });
  } catch {
    return raw.split(',').map((name) => name.trim()).filter(Boolean)
      .map((name) => ({ name, qty: servings, unit: 'portion' }));
  }
}

function formatAmount(amount: number) {
  return Number.isInteger(amount) ? String(amount) : String(Math.round(amount * 10) / 10);
}

function getReasonKey(reason?: string) {
  if (reason?.toLowerCase().includes('high protein')) return 'highProtein';
  if (reason?.toLowerCase().includes('budget-friendly')) return 'budgetFriendly';
  if (reason?.toLowerCase().includes('moroccan')) return 'moroccan';
  if (reason?.toLowerCase().includes('gain-weight')) return 'gainWeight';
  if (reason?.toLowerCase().includes('weight-management')) return 'weightManagement';
  return 'balanced';
}

interface CheckInUpdate {
  waterDelta?: number;
  waterGlasses?: number;
  walkedMinutesDelta?: number;
  mealId?: number;
  eaten?: boolean;
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBmiLabelKey(bmi?: number): string | undefined {
  if (!bmi) return undefined;
  if (bmi < 18.5) return 'dashboard.bmiLabels.underweight';
  if (bmi < 25) return 'dashboard.bmiLabels.normal';
  if (bmi < 30) return 'dashboard.bmiLabels.overweight';
  return 'dashboard.bmiLabels.obese';
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function Dashboard({ user, onLogout, onSessionExpired, token }: DashboardProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [today] = useState(() => {
    const localToday = new Date();
    return {
      localDate: getLocalDateKey(localToday),
      dayOfWeek: (localToday.getDay() + 6) % 7,
    };
  });
  const { localDate, dayOfWeek: todayIndex } = today;
  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(Boolean(token));
  const [planError, setPlanError] = useState('');
  const [checkIn, setCheckIn] = useState<DailyCheckIn | null>(null);
  const [loadingCheckIn, setLoadingCheckIn] = useState(Boolean(token));
  const [updatingCheckIn, setUpdatingCheckIn] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(null);
  const [healthScoreError, setHealthScoreError] = useState('');
  const [healthScoreHistory, setHealthScoreHistory] = useState<HealthScoreSnapshot[]>([]);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  const [selectedMeal, setSelectedMeal] = useState<WeekPlanMeal | null>(null);
  const [page, setPage] = useState<'dashboard' | 'shopping'>('dashboard');

  useEffect(() => {
    if (!token) return;

    const fetchCheckIn = async () => {
      try {
        const response = await fetch(`${API}/user/checkin?date=${localDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const data = await safeJson(response);
        if (!response.ok || !data) throw new Error(t('dailyCheckIn.loadError'));
        setCheckIn(data);
      } catch (err) {
        setCheckInError(err instanceof Error ? err.message : t('dailyCheckIn.loadError'));
      } finally {
        setLoadingCheckIn(false);
      }
    };

    void fetchCheckIn();
  }, [token, t, localDate, onSessionExpired]);

  useEffect(() => {
    if (!token) return;

    const fetchHealthScore = async () => {
      try {
        const response = await fetch(`${API}/health-score?date=${localDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const data = await safeJson(response);
        if (!response.ok || !data) throw new Error(t('healthScore.loadError'));
        setHealthScore(data);
      } catch (err) {
        setHealthScoreError(err instanceof Error ? err.message : t('healthScore.loadError'));
      }
    };

    void fetchHealthScore();
  }, [token, t, localDate, checkIn, onSessionExpired]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API}/health-score/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const data = await safeJson(response);
        if (!response.ok || !Array.isArray(data)) return;
        if (!cancelled) setHealthScoreHistory(data);
      } catch {
        if (!cancelled) setHealthScoreHistory([]);
      }
    };
    void fetchHistory();
    return () => { cancelled = true; };
  }, [token, onSessionExpired, checkIn]);

  useEffect(() => {
    if (!token) return;

    const fetchWeekPlan = async () => {
      try {
        const response = await fetch(`${API}/weekplan`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }

        if (!response.ok) {
          if (response.status === 404) {
            setWeekPlan(null);
            return;
          }
          throw new Error(t('weekPlan.loadError'));
        }

        const data = await safeJson(response);
        if (data) {
          setWeekPlan(data);
          return;
        }

        const generateResponse = await fetch(`${API}/weekplan/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (generateResponse.status === 401) {
          onSessionExpired();
          return;
        }
        if (!generateResponse.ok) throw new Error(t('weekPlan.generateError'));
        setWeekPlan(await safeJson(generateResponse));
      } catch (err) {
        setPlanError(err instanceof Error ? err.message : t('weekPlan.loadError'));
      } finally {
        setLoadingPlan(false);
      }
    };

    void fetchWeekPlan();
  }, [token, t, onSessionExpired]);

  const generatePlan = async () => {
    if (!token) return;
    setLoadingPlan(true);
    setPlanError('');

    try {
      const response = await fetch(`${API}/weekplan/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      if (!response.ok) throw new Error(t('weekPlan.generateError'));
      setWeekPlan((await safeJson(response)) ?? null);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : t('weekPlan.generateError'));
    } finally {
      setLoadingPlan(false);
    }
  };

  const updateCheckIn = async (update: CheckInUpdate) => {
    if (!token) return;
    setUpdatingCheckIn(true);
    setCheckInError('');

    try {
      const response = await fetch(`${API}/user/checkin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...update, localDate }),
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await safeJson(response);
      if (!response.ok || !data) {
        throw new Error(data?.message || t('dailyCheckIn.updateError'));
      }
      setCheckIn(data);
    } catch (err) {
      setCheckInError(err instanceof Error ? err.message : t('dailyCheckIn.updateError'));
    } finally {
      setUpdatingCheckIn(false);
    }
  };

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const todayMeals = weekPlan?.meals
    .filter((meal) => meal.dayOfWeek === todayIndex)
    .sort((first, second) => {
      const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
      return mealOrder.indexOf(first.mealType) - mealOrder.indexOf(second.mealType);
    }) ?? [];
  const waterProgress = Math.min((checkIn?.waterGlasses ?? 0) / 8, 1) * 100;
  const mealDoneCount = todayMeals.filter((meal) => checkIn?.eatenMealIds.includes(meal.id)).length;
  const hasPlanMeals = Boolean(weekPlan && weekPlan.meals.length > 0);
  const scoreColor = !healthScore || healthScore.score < 40
    ? 'text-red-500'
    : healthScore.score < 70
      ? 'text-amber-500'
      : 'text-emerald-600';
  const scoreRingColor = !healthScore || healthScore.score < 40
    ? 'stroke-red-500'
    : healthScore.score < 70
      ? 'stroke-amber-500'
      : 'stroke-emerald-600';

  if (page === 'shopping') {
    return (
      <ShoppingList
        token={token ?? ''}
        onBack={() => setPage('dashboard')}
        onSessionExpired={onSessionExpired}
      />
    );
  }

  return (
    <motion.main
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={revealVariants}
      className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-8 sm:px-6 lg:py-10"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.header variants={rowVariants} className="flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Food Healthy</p>
            <h1 className="mt-1 text-3xl font-bold text-emerald-950">
              {t('dashboard.welcome')}, {user.firstName}
            </h1>
            <p className="mt-1 text-gray-600">{t('dashboard.profileReady')}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage('shopping')}
              className="rounded-2xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-emerald-900/5 transition hover:bg-emerald-700"
            >
              {t('shoppingList.open')}
            </button>
            <button
              onClick={onLogout}
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 font-semibold text-emerald-800 shadow-lg shadow-emerald-900/5 transition hover:bg-emerald-50"
            >
              {t('dashboard.logout')}
            </button>
          </div>
        </motion.header>

        <motion.section variants={rowVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label={t('dashboard.stats')}>
          <article className="rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-900/5">
            <p className="text-3xl font-bold">{user.dailyCalories ?? '—'}</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/90">
              <Flame aria-hidden="true" className="h-4 w-4" /> {t('dashboard.dailyKcal')}
            </p>
          </article>
          <article className="rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-900/5">
            <p className="text-3xl font-bold">{user.bmi ?? '—'}</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/90">
              <Scale aria-hidden="true" className="h-4 w-4" /> {t('dashboard.bmi')}
              {getBmiLabelKey(user.bmi) && ` · ${t(getBmiLabelKey(user.bmi)!)}`}
            </p>
          </article>
          <article className="rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-900/5">
            <p className="text-3xl font-bold">{user.tdee ?? '—'}</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/90">
              <Target aria-hidden="true" className="h-4 w-4" /> {t('dashboard.tdee')}
            </p>
          </article>
        </motion.section>

        {typeof user.bmi === 'number' && (user.bmi < 18.5 || user.bmi >= 25) && (
          <motion.aside variants={rowVariants} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
            {t('dashboard.bmiGoalEducation', {
              bmi: user.bmi,
              goal: user.goal ? t(`onboarding.${user.goal === 'gain_weight' ? 'gainWeight' : user.goal === 'lose_weight' ? 'loseWeight' : user.goal}`) : t('onboarding.health'),
              dailyCalories: user.dailyCalories ?? 0,
            })}
          </motion.aside>
        )}

        <motion.section
          variants={rowVariants}
          className="rounded-2xl bg-white p-5 shadow-lg shadow-emerald-900/5 sm:p-6"
          aria-labelledby="daily-check-in-title"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="daily-check-in-title" className="text-xl font-bold text-emerald-950">
                {t('dailyCheckIn.title')}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{t('dailyCheckIn.subtitle')}</p>
            </div>
            {checkIn && (
              <span className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                {mealDoneCount}/{todayMeals.length} {t('dailyCheckIn.mealsDone')}
              </span>
            )}
          </div>

          {checkInError && <p role="alert" className="mb-4 text-sm text-amber-700">{checkInError}</p>}

          {loadingCheckIn ? (
            <div className="grid gap-4 lg:grid-cols-2" aria-label={t('dailyCheckIn.loading')}>
              <div className="h-40 animate-pulse rounded-2xl bg-blue-50" />
              <div className="h-40 animate-pulse rounded-2xl bg-emerald-50" />
            </div>
          ) : checkIn ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{t('dailyCheckIn.water')}</p>
                      <p className="mt-1 text-2xl font-bold text-blue-800">
                        {checkIn.waterGlasses}<span className="text-sm font-medium text-blue-700"> / 8 {t('dailyCheckIn.glasses')}</span>
                      </p>
                    </div>
                    <Droplet aria-hidden="true" className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-1" role="group" aria-label={t('dailyCheckIn.water')}>
                    {Array.from({ length: 8 }, (_, index) => {
                      const amount = index + 1;
                      const filled = index < checkIn.waterGlasses;
                      return (
                        <motion.button
                          key={amount}
                          type="button"
                          aria-label={t('dailyCheckIn.setWater', { count: amount })}
                          aria-pressed={checkIn.waterGlasses === amount}
                          disabled={updatingCheckIn}
                          onClick={() => void updateCheckIn({ waterGlasses: amount })}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.82 }}
                          className="rounded-full p-1.5 text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                          <Droplet
                            aria-hidden="true"
                            className={`h-6 w-6 transition-colors duration-300 ${filled ? 'fill-blue-500 text-blue-600' : 'text-blue-300'}`}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"
                    role="progressbar"
                    aria-label={t('dailyCheckIn.water')}
                    aria-valuemin={0}
                    aria-valuemax={8}
                    aria-valuenow={Math.min(checkIn.waterGlasses, 8)}
                  >
                    <motion.div
                      initial={prefersReducedMotion ? false : { width: 0 }}
                      animate={{ width: `${waterProgress}%` }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full bg-linear-to-r from-sky-400 to-blue-600"
                    />
                  </div>
                </article>

                <article className="rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-sky-950">{t('dailyCheckIn.walking')}</p>
                      <p className="mt-1 text-2xl font-bold text-sky-800">
                        {checkIn.walkedMinutes}<span className="text-sm font-medium text-sky-700"> {t('dailyCheckIn.minutes')}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void updateCheckIn({ walkedMinutesDelta: 10 })}
                      disabled={updatingCheckIn || checkIn.walkedMinutes >= 1440}
                      aria-label={t('dailyCheckIn.addWalk')}
                      className="rounded-2xl border border-sky-200 bg-white px-4 py-2 font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50"
                    >
                      +10 {t('dailyCheckIn.minutes')}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-sky-700">{t('dailyCheckIn.addTenMinutes')}</p>
                </article>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900">{t('dailyCheckIn.meals')}</h3>
                {todayMeals.length > 0 ? (
                  <motion.div
                    initial={prefersReducedMotion ? false : 'hidden'}
                    animate="visible"
                    variants={revealVariants}
                    className="divide-y divide-emerald-100 overflow-hidden rounded-2xl border border-emerald-100"
                  >
                    {todayMeals.map((meal) => {
                      const eaten = checkIn.eatenMealIds.includes(meal.id);
                      const recipeName = recipeTranslationKeys[meal.recipe.name]
                        ? t(`weekPlan.recipes.${recipeTranslationKeys[meal.recipe.name]}`)
                        : meal.recipe.name;
                      const MealIcon = mealIcons[meal.mealType] ?? Apple;
                      return (
                        <motion.label
                          key={meal.id}
                          variants={rowVariants}
                          className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-emerald-50 sm:p-4"
                        >
                          <input
                            type="checkbox"
                            checked={eaten}
                            disabled={updatingCheckIn}
                            onChange={(event) =>
                              void updateCheckIn({ mealId: meal.id, eaten: event.target.checked })
                            }
                            className="h-5 w-5 shrink-0 accent-emerald-600"
                          />
                          <MealIcon aria-hidden="true" className={`h-5 w-5 shrink-0 text-emerald-700 ${eaten ? 'opacity-50' : ''}`} />
                          <span className={`min-w-0 flex-1 transition-opacity ${eaten ? 'opacity-50' : ''}`}>
                            <span className="block text-xs font-semibold uppercase text-emerald-700">
                              {t(`weekPlan.meals.${meal.mealType}`, { defaultValue: meal.mealType })}
                            </span>
                            <span className={`block truncate text-sm ${eaten ? 'line-through' : 'text-gray-900'}`}>
                              {recipeName}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-medium text-gray-600">
                            {Math.round((meal.recipe.calories ?? 0) * meal.servings)} {t('weekPlan.kcal')}
                          </span>
                        </motion.label>
                      );
                    })}
                  </motion.div>
                ) : (
                  <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">{t('dailyCheckIn.noMeals')}</p>
                )}
              </div>
            </div>
          ) : null}
        </motion.section>

        <motion.section variants={rowVariants} className="rounded-2xl bg-white p-5 shadow-lg shadow-emerald-900/5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-emerald-950">{t('weekPlan.title')}</h2>
            </div>
            {!hasPlanMeals && (
              <button
                onClick={generatePlan}
                disabled={loadingPlan}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loadingPlan ? t('weekPlan.loading') : t('weekPlan.generate')}
              </button>
            )}
          </div>

          {planError && <p role="alert" className="mb-3 text-sm text-amber-700">{planError}</p>}

          {loadingPlan ? (
            <div className="flex gap-3 overflow-hidden" aria-label={t('weekPlan.loading')}>
              {[0, 1, 2, 3].map((day) => <div key={day} className="h-72 w-64 shrink-0 animate-pulse rounded-2xl bg-emerald-50" />)}
            </div>
          ) : weekPlan && weekPlan.meals.length > 0 ? (
            <div className="-mx-1 snap-x snap-mandatory overflow-x-auto px-1 pb-4 md:mx-0 md:overflow-visible md:px-0">
              <div className="flex w-max gap-3 xl:grid xl:w-auto xl:grid-cols-7 xl:gap-2">
                {dayKeys.map((dayKey, index) => {
                  const mealsForDay = weekPlan.meals
                    .filter((meal) => meal.dayOfWeek === index)
                    .sort((first, second) => {
                      const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
                      return mealOrder.indexOf(first.mealType) - mealOrder.indexOf(second.mealType);
                    });
                  const dayCalories = mealsForDay.reduce(
                    (total, meal) => total + (meal.recipe.calories ?? 0) * meal.servings,
                    0,
                  );
                  const isToday = index === todayIndex;

                  return (
                    <article
                      key={dayKey}
                      className={`w-[82vw] max-w-77.5 shrink-0 snap-center rounded-2xl border p-3 shadow-lg shadow-emerald-900/5 transition-transform xl:w-auto xl:max-w-none xl:p-2.5 ${
                        isToday
                          ? 'relative z-10 scale-[1.02] border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 xl:scale-105'
                          : 'border-emerald-100 bg-white'
                      }`}
                    >
                      <div className="mb-3 flex min-h-9 items-center justify-between gap-1">
                        <div>
                          <p className="text-xs font-medium text-gray-500">{t(`weekPlan.days.${dayKey}`)}</p>
                          <h3 dir="rtl" className="text-sm font-bold text-emerald-900">
                            {t(`weekPlan.arabicDays.${dayKey}`)}
                          </h3>
                        </div>
                        {isToday && (
                          <span className="rounded-full bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white">
                            {t('weekPlan.today')}
                          </span>
                        )}
                      </div>
                      <div className="relative space-y-3 border-s border-emerald-200 ps-3">
                        {mealsForDay.map((meal) => {
                          const recipeName = recipeTranslationKeys[meal.recipe.name]
                            ? t(`weekPlan.recipes.${recipeTranslationKeys[meal.recipe.name]}`)
                            : meal.recipe.name;
                          const MealIcon = mealIcons[meal.mealType] ?? Apple;
                          const calories = meal.recipe.calories ?? 0;
                          const protein = (meal.recipe.proteinGrams ?? calories * 0.25 / 4) * meal.servings;
                          const carbs = (meal.recipe.carbGrams ?? calories * 0.5 / 4) * meal.servings;
                          const fat = (meal.recipe.fatGrams ?? calories * 0.25 / 9) * meal.servings;
                          const macroCalories = protein * 4 + carbs * 4 + fat * 9;
                          const proteinWidth = macroCalories > 0 ? protein * 4 / macroCalories * 100 : 0;
                          const carbWidth = macroCalories > 0 ? carbs * 4 / macroCalories * 100 : 0;
                          const fatWidth = macroCalories > 0 ? fat * 9 / macroCalories * 100 : 0;
                          return (
                            <div key={`${meal.id}-${meal.mealType}`} className="relative min-w-0">
                              <span className="absolute -inset-s-4.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-200" />
                              <div className="min-w-0 rounded-2xl bg-emerald-50/70 p-2">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold uppercase text-emerald-800">
                                    <MealIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{t(`weekPlan.meals.${meal.mealType}`, { defaultValue: meal.mealType })}</span>
                                  </span>
                                  <span className="shrink-0 text-[10px] text-gray-600">
                                    {Math.round((meal.recipe.calories ?? 0) * meal.servings)} {t('weekPlan.kcal')}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  title={recipeName}
                                  onClick={() => setSelectedMeal(meal)}
                                  className="mt-1 block w-full truncate text-start text-xs font-semibold text-gray-900 underline-offset-2 hover:text-emerald-800 hover:underline"
                                >
                                  {recipeName}
                                </button>
                                {meal.reason && (
                                  <p title={meal.reason} className="mt-1 truncate text-[10px] text-emerald-800">
                                    {t(`weekPlan.reasons.${getReasonKey(meal.reason)}`)}
                                  </p>
                                )}
                                <p className="mt-1 truncate text-[10px] text-gray-500">
                                  ~{Math.round(meal.recipe.servingGrams * meal.servings)} {t('weekPlan.grams')}
                                </p>
                                {macroCalories > 0 && (
                                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-100" aria-label={t('recipeDetail.macros')}>
                                    <span className="bg-emerald-500" style={{ width: `${proteinWidth}%` }} />
                                    <span className="bg-amber-400" style={{ width: `${carbWidth}%` }} />
                                    <span className="bg-rose-400" style={{ width: `${fatWidth}%` }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-emerald-100 pt-2 text-[11px] font-semibold text-emerald-900">
                        <span>{t('weekPlan.dayTotal')}</span>
                        <span>{Math.round(dayCalories)} {t('weekPlan.kcal')}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-6 text-center">
              <p className="font-semibold text-emerald-950">{t('weekPlan.emptyHeadline')}</p>
              <p className="mt-1 text-sm text-gray-600">{t('weekPlan.noPlan')}</p>
              <button type="button" onClick={() => void generatePlan()} disabled={loadingPlan} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {t('weekPlan.emptyAction')}
              </button>
            </div>
          )}
        </motion.section>

        <motion.section variants={rowVariants} className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPage('shopping')}
            className="rounded-2xl bg-white p-5 text-start shadow-lg shadow-emerald-900/5 transition hover:bg-emerald-50"
          >
            <p className="font-semibold text-gray-900">{t('dashboard.shoppingList')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('shoppingList.openDescription')}</p>
          </button>
          <article className="rounded-2xl bg-white p-5 shadow-lg shadow-emerald-900/5">
            <button
              type="button"
              onClick={() => setShowHealthDetails((open) => !open)}
              aria-expanded={showHealthDetails}
              className="flex w-full items-center gap-5 text-start"
            >
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={t('healthScore.ringLabel', { score: healthScore?.score ?? 0 })}>
                  <circle cx="50" cy="50" r="43" fill="none" strokeWidth="8" className="stroke-emerald-100" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={scoreRingColor}
                    strokeDasharray={2 * Math.PI * 43}
                    initial={prefersReducedMotion ? false : { strokeDashoffset: 2 * Math.PI * 43 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 43 * (1 - (healthScore?.score ?? 0) / 100) }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: 'easeOut' }}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${scoreColor}`}>
                  {healthScore?.score ?? '—'}
                </span>
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-gray-900">{t('healthScore.title')}</span>
                {healthScoreError ? (
                  <span className="mt-1 block text-sm text-amber-700">{healthScoreError}</span>
                ) : (
                  <span className="mt-1 block text-sm text-gray-600">
                    {healthScore ? t('healthScore.dailySnapshot') : t('healthScore.loading')}
                  </span>
                )}
                {healthScore && (
                  <span className="mt-2 block text-xs text-gray-500">
                    {healthScore.breakdown.bmi}/40 · {healthScore.breakdown.water}/30 · {healthScore.breakdown.meals}/30
                  </span>
                )}
              </span>
            </button>
            {showHealthDetails && healthScore && (
              <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
                {([
                  ['bmi', 40, healthScore.breakdown.bmi],
                  ['water', 30, healthScore.breakdown.water],
                  ['meals', 30, healthScore.breakdown.meals],
                ] as const).map(([key, max, value]) => {
                  const percent = Math.min(value / max, 1) * 100;
                  const bmiHealthyMax = user.height ? 24.9 * (user.height / 100) ** 2 : user.idealWeightMax;
                  const weightToLose = user.weight && bmiHealthyMax ? Math.max(0, Math.ceil(user.weight - bmiHealthyMax)) : 0;
                  const tip = key === 'bmi'
                    ? (user.bmi ?? 0) < 18.5
                      ? t('healthScore.bmiUnderweightTip', { bmi: user.bmi ?? 0 })
                      : t('healthScore.bmiOverweightTip', { bmi: user.bmi ?? 0, kilos: weightToLose, maxWeight: Math.round(bmiHealthyMax ?? 0) })
                    : key === 'water'
                      ? percent >= 100
                        ? t('healthScore.waterGoodTip')
                        : t('healthScore.waterTip', { ml: Math.max(0, healthScore.waterMlTarget - healthScore.waterMlDrunk) })
                      : percent >= 100
                        ? t('healthScore.mealsGoodTip')
                        : t('healthScore.mealsTip', { count: healthScore.mealsCompleted });
                  return (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
                        <span>{t(`healthScore.components.${key}`)}</span><span>{value}/{max}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{tip}</p>
                    </div>
                  );
                })}
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-700">{t('healthScore.history')}</p>
                  {healthScoreHistory.length > 1 ? (
                    <svg viewBox="0 0 300 52" className="h-14 w-full overflow-visible" role="img" aria-label={t('healthScore.history')}>
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-500"
                        points={healthScoreHistory.map((point, index) => {
                          const x = index / (healthScoreHistory.length - 1) * 296 + 2;
                          const y = 48 - point.score / 100 * 44;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    </svg>
                  ) : (
                    <p className="text-xs text-gray-500">{t('healthScore.historyEmpty')}</p>
                  )}
                </div>
              </div>
            )}
          </article>
        </motion.section>

        {selectedMeal && (() => {
          const recipeName = recipeTranslationKeys[selectedMeal.recipe.name]
            ? t(`weekPlan.recipes.${recipeTranslationKeys[selectedMeal.recipe.name]}`)
            : selectedMeal.recipe.name;
          const ingredients = parseRecipeIngredients(selectedMeal.recipe.ingredients, selectedMeal.servings);
          const estimatedNutrition = selectedMeal.recipe.proteinGrams == null || selectedMeal.recipe.carbGrams == null || selectedMeal.recipe.fatGrams == null;
          const calories = selectedMeal.recipe.calories ?? 0;
          const protein = Math.round((selectedMeal.recipe.proteinGrams ?? calories * 0.25 / 4) * selectedMeal.servings);
          const carbs = Math.round((selectedMeal.recipe.carbGrams ?? calories * 0.5 / 4) * selectedMeal.servings);
          const fat = Math.round((selectedMeal.recipe.fatGrams ?? calories * 0.25 / 9) * selectedMeal.servings);
          const proteinPercent = user.proteinGrams ? Math.round(protein / user.proteinGrams * 100) : 0;
          return (
            <div className="fixed inset-0 z-60 flex items-end justify-center bg-emerald-950/45 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMeal(null); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{t(`weekPlan.meals.${selectedMeal.mealType}`)}</p>
                    <h2 id="recipe-detail-title" className="mt-1 text-2xl font-bold text-emerald-950">{recipeName}</h2>
                  </div>
                  <button type="button" onClick={() => setSelectedMeal(null)} aria-label={t('recipeDetail.close')} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
                    <X aria-hidden="true" className="h-5 w-5" />
                  </button>
                </header>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs text-gray-600">{t('weekPlan.kcal')}</p><p className="mt-1 font-bold text-emerald-900">{Math.round((selectedMeal.recipe.calories ?? 0) * selectedMeal.servings)}</p></div>
                  <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs text-gray-600">{t('recipeDetail.protein')}</p><p className="mt-1 font-bold text-emerald-900">{protein} {t('weekPlan.grams')}</p></div>
                  <div className="rounded-2xl bg-amber-50 p-3"><p className="text-xs text-gray-600">{t('recipeDetail.carbs')}</p><p className="mt-1 font-bold text-amber-900">{carbs} {t('weekPlan.grams')}</p></div>
                  <div className="rounded-2xl bg-rose-50 p-3"><p className="text-xs text-gray-600">{t('recipeDetail.fat')}</p><p className="mt-1 font-bold text-rose-900">{fat} {t('weekPlan.grams')}</p></div>
                </div>
                {estimatedNutrition && <p className="mt-2 text-xs text-gray-500">{t('recipeDetail.estimatedMacros')}</p>}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900">{t('recipeDetail.ingredients')}</h3>
                  {ingredients.length ? (
                    <ul className="mt-2 divide-y divide-gray-100">
                      {ingredients.map((ingredient, index) => (
                        <li key={`${ingredient.name}-${index}`} className="flex justify-between gap-3 py-2 text-sm">
                          <span className="text-gray-800">{ingredient.name}</span>
                          <span className="shrink-0 font-medium text-emerald-800">{formatAmount(ingredient.qty)} {t(`shoppingList.units.${ingredient.unit}`, { defaultValue: ingredient.unit })}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-2 text-sm text-gray-500">{t('recipeDetail.ingredientsUnavailable')}</p>}
                </div>
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <h3 className="font-semibold text-emerald-950">{t('recipeDetail.whyTitle')}</h3>
                  <p className="mt-1 text-sm text-emerald-900">
                    {t('recipeDetail.proteinFit', { percent: proteinPercent })}
                    {selectedMeal.reason ? ` ${t(`weekPlan.reasons.${getReasonKey(selectedMeal.reason)}`)}` : ''}
                  </p>
                </div>
              </section>
            </div>
          );
        })()}
      </div>
    </motion.main>
  );
}

export default Dashboard;

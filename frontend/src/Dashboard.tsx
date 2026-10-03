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
  type LucideIcon,
} from 'lucide-react';

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
  };
  onLogout: () => void;
  token?: string;
}

interface WeekPlanMeal {
  id: number;
  dayOfWeek: number;
  mealType: string;
  servings: number;
  recipe: {
    name: string;
    calories?: number | null;
    servingGrams: number;
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

function Dashboard({ user, onLogout, token }: DashboardProps) {
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

  useEffect(() => {
    if (!token) return;

    const fetchCheckIn = async () => {
      try {
        const response = await fetch(`${API}/user/checkin?date=${localDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
  }, [token, t, localDate]);

  useEffect(() => {
    if (!token) return;

    const fetchWeekPlan = async () => {
      try {
        const response = await fetch(`${API}/weekplan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
        if (!generateResponse.ok) throw new Error(t('weekPlan.generateError'));
        setWeekPlan(await safeJson(generateResponse));
      } catch (err) {
        setPlanError(err instanceof Error ? err.message : t('weekPlan.loadError'));
      } finally {
        setLoadingPlan(false);
      }
    };

    void fetchWeekPlan();
  }, [token, t]);

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
          <button
            onClick={onLogout}
            className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 font-semibold text-emerald-800 shadow-lg shadow-emerald-900/5 transition hover:bg-emerald-50"
          >
            {t('dashboard.logout')}
          </button>
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
            <p className="text-gray-600">{t('dailyCheckIn.loading')}</p>
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
            {!weekPlan && (
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
            <p className="text-gray-600">{t('weekPlan.loading')}</p>
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
                                <p title={recipeName} className="mt-1 truncate text-xs font-medium text-gray-900">
                                  {recipeName}
                                </p>
                                <p className="mt-1 truncate text-[10px] text-gray-500">
                                  ~{Math.round(meal.recipe.servingGrams * meal.servings)} {t('weekPlan.grams')}
                                </p>
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
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-gray-600">{t('weekPlan.noPlan')}</p>
          )}
        </motion.section>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl bg-white p-5 opacity-70 shadow-lg shadow-emerald-900/5">
            <p className="font-semibold text-gray-800">{t('dashboard.shoppingList')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('dashboard.comingSoon')}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 opacity-70 shadow-lg shadow-emerald-900/5">
            <p className="font-semibold text-gray-800">{t('dashboard.healthScore')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('dashboard.comingSoon')}</p>
          </article>
        </div>
      </div>
    </motion.main>
  );
}

export default Dashboard;

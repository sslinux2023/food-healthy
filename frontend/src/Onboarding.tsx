import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  token: string;
  onComplete: (data: any) => void;
}

const goals = [
  { value: 'lose_weight', labelKey: 'onboarding.loseWeight' },
  { value: 'maintain', labelKey: 'onboarding.maintain' },
  { value: 'gain_weight', labelKey: 'onboarding.gainWeight' },
  { value: 'health', labelKey: 'onboarding.health' },
];

const lifestyles = [
  { value: 'sedentary', labelKey: 'onboarding.sedentary' },
  { value: 'moderate', labelKey: 'onboarding.moderate' },
  { value: 'active', labelKey: 'onboarding.active' },
];

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Onboarding({ token, onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('health');
  const [lifestyle, setLifestyle] = useState('moderate');
  const [walksRegularly, setWalksRegularly] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [foodDislikes, setFoodDislikes] = useState('');
  const [familyMembersCount, setFamilyMembersCount] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/user/onboarding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: Number(age),
          gender,
          height: Number(height),
          weight: Number(weight),
          goal,
          lifestyle,
          walksRegularly,
          weeklyBudget: Number(weeklyBudget),
          foodPreferences,
          foodDislikes,
          familyMembersCount: Number(familyMembersCount),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Onboarding failed');
      }

      const data = await response.json();
      onComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-emerald-600 text-center mb-1">{t('onboarding.title')}</h1>
        <p className="text-gray-500 text-center text-sm mb-6">{t('onboarding.subtitle')}</p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* About You */}
          <div>
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{t('onboarding.aboutYou')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('onboarding.age')}</label>
                <input
                  type="number" value={age}
                  onChange={(e) => setAge(e.target.value)} required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.gender')}</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                  <option value="male">{t('onboarding.male')}</option>
                  <option value="female">{t('onboarding.female')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.height')}</label>
                <input
                  type="number" value={height}
                  onChange={(e) => setHeight(e.target.value)} required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.weight')}</label>
                <input
                  type="number" value={weight}
                  onChange={(e) => setWeight(e.target.value)} required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Goal */}
          <div>
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{t('onboarding.yourGoal')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`text-start border rounded-lg px-3 py-2 text-sm transition ${
                    goal === g.value
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 text-emerald-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(g.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Lifestyle */}
          <div>
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{t('onboarding.lifestyle')}</h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {lifestyles.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLifestyle(l.value)}
                  className={`border rounded-lg px-2 py-2 text-sm transition ${
                    lifestyle === l.value
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 text-emerald-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(l.labelKey)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox" checked={walksRegularly}
                onChange={(e) => setWalksRegularly(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              {t('onboarding.walksRegularly')}
            </label>
          </div>

          {/* Food Preferences */}
          <div>
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{t('onboarding.foodPreferences')}</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>{t('onboarding.foodsLove')}</label>
                <input
                  placeholder={t('onboarding.foodsLovePlaceholder')} value={foodPreferences}
                  onChange={(e) => setFoodPreferences(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.foodsDislike')}</label>
                <input
                  placeholder={t('onboarding.foodsDislikePlaceholder')} value={foodDislikes}
                  onChange={(e) => setFoodDislikes(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Family & Budget */}
          <div>
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">{t('onboarding.familyBudget')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('onboarding.familyMembers')}</label>
                <input
                  type="number" min={1} value={familyMembersCount}
                  onChange={(e) => setFamilyMembersCount(e.target.value)} required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.weeklyBudget')}</label>
                <input
                  type="number" value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(e.target.value)} required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg px-4 py-2.5 font-medium transition"
          >
            {loading ? t('onboarding.saving') : t('onboarding.finishSetup')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
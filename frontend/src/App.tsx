import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Onboarding from './Onboarding.tsx';
import Dashboard from './Dashboard.tsx';
import LanguageSwitcher from './components/LanguageSwitcher.tsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  onboardingCompleted?: boolean;
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
}

function App() {
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  // ⭐ NEW: On mount, if a token exists, fetch the user profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    const url = isRegister ? `${API}/user/register` : `${API}/user/login`;
    const body = isRegister
      ? { email, password, firstName, lastName }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(', ') : data.message,
        );
      }

      // ⭐ Store token
      localStorage.setItem('token', data.access_token);

      // ⭐ Login returns { access_token, user: {...} } — Register returns flat
      const userData: User = data.user ?? data;
      setUser(userData);
      setMessage(
        isRegister ? t('auth.registeredSuccess') : t('auth.loginSuccess'),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('auth.unknownError');
      setMessage(`${t('auth.errorPrefix')} ${errorMessage}`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  // ⭐ Called by Onboarding after successful submit
  const handleOnboardingComplete = () => {
    // Re-fetch the user to get fresh onboardingCompleted = true
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  let content;

  if (user && !user.onboardingCompleted) {
    // Logged in but onboarding not done → onboarding page
    content = (
      <Onboarding token={localStorage.getItem('token') || ''} onComplete={handleOnboardingComplete} />
    );
  } else if (user) {
    // Logged in + onboarding done → dashboard
    content = (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        token={localStorage.getItem('token') || ''}
        onSessionExpired={handleLogout}
      />
    );
  } else {
    // Not logged in → login/register form
    content = (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-3xl font-bold text-emerald-600 text-center mb-1">
            {t('app.title')} 🌿
          </h1>
          <h2 className="text-lg text-gray-500 text-center mb-6">
            {isRegister ? t('auth.register') : t('auth.login')}
          </h2>

          {message && <p className="text-red-500 text-sm mb-4">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <input
                  placeholder={t('auth.firstName')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                />
                <input
                  placeholder={t('auth.lastName')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                />
              </>
            )}
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
            <input
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 font-medium"
            >
              {isRegister ? t('auth.register') : t('auth.login')}
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-4 text-sm text-gray-500 hover:text-emerald-600"
          >
            {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LanguageSwitcher />
      {content}
    </>
  );
}

export default App;
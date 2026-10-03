import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n.ts';
const savedLang = localStorage.getItem('lang') || 'en';
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Lock, Mail, AlertCircle, Sun, Moon, ArrowRight, ShieldCheck, Wrench, Eye } from 'lucide-react';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [emailOrUser, setEmailOrUser] = useState('admin@netmonitor.internal');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(emailOrUser, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'การยืนยันตัวตนล้มเหลว');
    }
  };

  const handleQuickLogin = (role: Role, email: string, pass: string) => {
    setEmailOrUser(email);
    setPassword(pass);
    const res = login(email, pass);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Bar with Language and Theme */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-bold tracking-tight text-white">NetMonitor NOC</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setLang('th')}
              className={`px-2 py-0.5 text-xs font-semibold rounded ${
                lang === 'th' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              TH
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-xs font-semibold rounded ${
                lang === 'en' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 items-center justify-center mb-3">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{t('loginTitle')}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{t('loginSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t('usernameOrEmail')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={emailOrUser}
                  onChange={e => setEmailOrUser(e.target.value)}
                  placeholder="admin@netmonitor.internal"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">{t('password')}</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors hover:underline"
                >
                  {t('forgotPasswordLink')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-0"
              />
              <label htmlFor="remember" className="ml-2 text-xs text-slate-400">
                {t('rememberMe')}
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{t('loginButton')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Mock Role Switcher for Test Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <div className="text-[11px] font-medium text-slate-400 text-center mb-2.5">
              {t('quickTestRoles')}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('Admin', 'admin@netmonitor.internal', 'admin123')}
                className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 text-[11px] font-medium transition-all text-center flex flex-col items-center gap-1 group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110" />
                <span>ผู้ดูแลระบบ</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Engineer', 'engineer@netmonitor.internal', 'engineer123')}
                className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 text-cyan-300 text-[11px] font-medium transition-all text-center flex flex-col items-center gap-1 group"
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110" />
                <span>วิศวกรระบบ</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Viewer', 'viewer@netmonitor.internal', 'viewer123')}
                className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 text-[11px] font-medium transition-all text-center flex flex-col items-center gap-1 group"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110" />
                <span>ผู้ดูข้อมูล</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2">
              {t('registerHere')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 font-mono">
        NetMonitor v4.2 Enterprise · ระบบ NOC มจพ. · ผ่านมาตรฐาน ISO/IEC 27001
      </footer>
    </div>
  );
};

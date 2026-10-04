import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Activity, Lock, Mail, User as UserIcon, Building2, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, users } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Network Infrastructure');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successRole, setSuccessRole] = useState<string | null>(null);

  const hasPriorRegisteredUsers = users.some(u => u.id.startsWith('usr-reg-'));
  const isFirstUser = !hasPriorRegisteredUsers || users.length === 0 || !users.some(u => u.role === 'Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    const res = register(name, email, password, department);
    if (res.success) {
      setSuccessRole(res.assignedRole || 'Engineer');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setError(res.error || 'ลงทะเบียนไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 selection:bg-cyan-500/20 selection:text-cyan-300">
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 items-center justify-center mb-3">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{t('registerTitle')}</h1>
            <p className="text-xs text-slate-400 mt-1">{t('registerSubtitle')}</p>
          </div>

          {/* First user alert banner */}
          <div className={`mb-4 p-3 rounded-lg border text-xs flex items-start gap-2 ${
            isFirstUser
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300'
          }`}>
            <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isFirstUser ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <div>
              <span className="font-semibold block">
                {isFirstUser ? t('firstUserNotice') : 'Policy: New accounts default to Network Engineer / Viewer clearance'}
              </span>
              <span className="text-[11px] opacity-80">
                Registration Status: <strong className="font-mono">{isFirstUser ? 'First Registrant (Will receive ADMIN)' : 'Standard Operator'}</strong>
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successRole && (
            <div className="mb-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>สร้างบัญชีด้วยสิทธิ์ <strong>{successRole}</strong> สำเร็จ กำลังเปลี่ยนหน้า...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('userName')}</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="เช่น ธนวัฒน์ บุญมี"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('userEmail')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="operator@netmonitor.internal"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('department')}</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="ฝ่ายปฏิบัติการ NOC"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('password')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('confirmPassword')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{t('registerButton')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            {t('haveAccount')}{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2">
              {t('loginHere')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

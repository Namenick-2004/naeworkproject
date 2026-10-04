import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  User as UserIcon,
  Mail,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { User, Role } from '../types';

export const UsersPage: React.FC = () => {
  const { t } = useLanguage();
  const {
    users,
    currentUser,
    createUser,
    updateUserRole,
    deleteUser,
    updateUserPermissions,
  } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Engineer' as Role,
    department: 'NOC Operations',
    status: 'Active' as 'Active' | 'Suspended',
    permissions: {
      canEditDevices: false,
      canManageUsers: false,
      canEditTopology: true,
      canImportConfig: true,
      canAcknowledgeAlerts: true,
      canModifySettings: false,
      canRebootDevices: true,
    },
  });

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(newUser);
    setShowAddModal(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'Engineer',
      department: 'NOC Operations',
      status: 'Active',
      permissions: {
        canEditDevices: false,
        canManageUsers: false,
        canEditTopology: true,
        canImportConfig: true,
        canAcknowledgeAlerts: true,
        canModifySettings: false,
        canRebootDevices: true,
      },
    });
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Admin':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Engineer':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Viewer':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            {t('userManagement')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('adminOnlyNote')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('createUser')}</span>
        </button>
      </div>

      {/* Authorised Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">{t('userName')}</th>
                <th className="py-3 px-4">{t('userEmail')}</th>
                <th className="py-3 px-4">{t('department')}</th>
                <th className="py-3 px-4">{t('role')}</th>
                <th className="py-3 px-4">{t('password')}</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">เข้าสู่ระบบล่าสุด</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {users.map(u => {
                const isPasswordShown = !!visiblePasswords[u.id];
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {u.department}
                    </td>

                    {/* Role Dropdown Selector */}
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={e => updateUserRole(u.id, e.target.value as Role)}
                        className={`text-[11px] font-mono font-semibold px-2 py-1 rounded border ${getRoleBadge(
                          u.role
                        )} bg-transparent focus:outline-none cursor-pointer disabled:cursor-not-allowed`}
                      >
                        <option value="Admin" className="bg-slate-900 text-white">ผู้ดูแลระบบ</option>
                        <option value="Engineer" className="bg-slate-900 text-white">วิศวกรระบบ</option>
                        <option value="Viewer" className="bg-slate-900 text-white">ผู้ดูข้อมูล</option>
                      </select>
                    </td>

                    {/* Password Visibility Toggle */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300 text-xs">
                          {isPasswordShown ? u.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          title={t('togglePassword')}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {u.status}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                      {u.lastLogin}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {!isSelf && (
                        <button
                          onClick={() => {
                            if (confirm(`ยืนยันการลบผู้ใช้ ${u.name} หรือไม่?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          title={t('deleteDevice')}
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                {t('createUser')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('userName')}</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="เช่น อนันตชัย ศรีสุข"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('userEmail')}</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@netmonitor.internal"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('password')}</label>
                  <input
                    type="text"
                    required
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="รหัสผ่านชั่วคราว"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('department')}</label>
                  <input
                    type="text"
                    required
                    value={newUser.department}
                    onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="ฝ่ายวิศวกรรม / SOC"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('role')}</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Admin">ผู้ดูแลระบบ (ควบคุมทั้งหมด)</option>
                    <option value="Engineer">วิศวกรระบบ (งานเทคนิค)</option>
                    <option value="Viewer">ผู้ดูข้อมูล (อ่านอย่างเดียว)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                  {t('customPermissions')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canEditDevices}
                      onChange={e =>
                        setNewUser({
                          ...newUser,
                          permissions: { ...newUser.permissions, canEditDevices: e.target.checked },
                        })
                      }
                      className="rounded text-rose-500"
                    />
                    <span>{t('canEditDevices')}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canEditTopology}
                      onChange={e =>
                        setNewUser({
                          ...newUser,
                          permissions: { ...newUser.permissions, canEditTopology: e.target.checked },
                        })
                      }
                      className="rounded text-rose-500"
                    />
                    <span>{t('canEditTopology')}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canAcknowledgeAlerts}
                      onChange={e =>
                        setNewUser({
                          ...newUser,
                          permissions: { ...newUser.permissions, canAcknowledgeAlerts: e.target.checked },
                        })
                      }
                      className="rounded text-rose-500"
                    />
                    <span>{t('canAcknowledgeAlerts')}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canImportConfig}
                      onChange={e =>
                        setNewUser({
                          ...newUser,
                          permissions: { ...newUser.permissions, canImportConfig: e.target.checked },
                        })
                      }
                      className="rounded text-rose-500"
                    />
                    <span>{t('canImportConfig')}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

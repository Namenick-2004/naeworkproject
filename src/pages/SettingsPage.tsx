import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNetworkData } from '../context/NetworkDataContext';
import { useAuth } from '../context/AuthContext';
import { BackupManager } from '../components/settings/BackupManager';
import {
  Settings,
  Bell,
  Clock,
  Send,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  Sliders,
  HardDrive,
  Shield,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings } = useNetworkData();
  const { currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'webhooks' | 'backups' | 'security'>('general');
  const [formData, setFormData] = useState({ ...settings });
  const [testSent, setTestSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestWebhook = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-500" />
          {t('settingsTitle')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Infrastructure telemetry intervals, automated backup policies, external notification webhooks & security constraints
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{t('generalSettings')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'backups'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>{t('backupManagerTitle')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 font-mono">
            Archive
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t('webhookSettings')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>ความปลอดภัยและเซสชัน</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{t('settingsSaved')}</span>
        </div>
      )}

      {testSent && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{t('testWebhookSuccess')}</span>
        </div>
      )}

      {/* Tab Content: Automated Backup Manager */}
      {activeTab === 'backups' && <BackupManager />}

      {/* Tab Content: General & Telemetry */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: General & Gateway */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Globe className="w-4 h-4 text-cyan-500" />
              {t('generalSettings')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('orgName')}</label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">IP เกตเวย์หลักเริ่มต้น</label>
                <input
                  type="text"
                  value={formData.gatewayIp}
                  onChange={e => setFormData({ ...formData, gatewayIp: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">เขตเวลาของระบบ</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">ภาษาเริ่มต้นของระบบ</label>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="th">ภาษาไทย (Thai)</option>
                  <option value="en">อังกฤษ (สหรัฐฯ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: SNMP Polling & Telemetry */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Radio className="w-4 h-4 text-cyan-500" />
              {t('pollingSettings')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  SNMP Polling Interval
                </label>
                <select
                  value={formData.snmpInterval}
                  onChange={e => setFormData({ ...formData, snmpInterval: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                >
                  <option value={10}>10 Seconds (Aggressive)</option>
                  <option value={30}>30 Seconds (Standard NOC)</option>
                  <option value={60}>60 Seconds (Conservation)</option>
                  <option value={300}>300 Seconds (5 Minutes)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  ICMP Ping Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.pingTimeoutMs}
                  onChange={e => setFormData({ ...formData, pingTimeoutMs: parseInt(e.target.value) || 1000 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Alarm Packet Loss Ceiling (%)
                </label>
                <input
                  type="number"
                  value={formData.packetLossThreshold}
                  onChange={e => setFormData({ ...formData, packetLossThreshold: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: Webhooks & Notifications */}
      {activeTab === 'webhooks' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-500" />
                {t('webhookSettings')}
              </h2>
              <button
                type="button"
                onClick={handleTestWebhook}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700"
              >
                <Send className="w-3 h-3 text-cyan-500" />
                <span>{t('testWebhook')}</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('slackWebhookUrl')}</label>
                <input
                  type="text"
                  value={formData.slackWebhook}
                  onChange={e => setFormData({ ...formData, slackWebhook: e.target.value })}
                  placeholder="Paste Slack incoming webhook URL"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('telegramToken')}</label>
                  <input
                    type="text"
                    value={formData.telegramBotToken}
                    onChange={e => setFormData({ ...formData, telegramBotToken: e.target.value })}
                    placeholder="6892419021:AAHEu9Wj42801Fkx_..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('telegramChatId')}</label>
                  <input
                    type="text"
                    value={formData.telegramChatId}
                    onChange={e => setFormData({ ...formData, telegramChatId: e.target.value })}
                    placeholder="-1002938491028"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('emailAlertsTo')}</label>
                <input
                  type="email"
                  value={formData.emailNotification}
                  onChange={e => setFormData({ ...formData, emailNotification: e.target.value })}
                  placeholder="noc-alerts@kmutnb.ac.th"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: Security & Sessions */}
      {activeTab === 'security' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Lock className="w-4 h-4 text-cyan-500" />
              Security & Authentication Session Governance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  {t('sessionTimeout')}
                </label>
                <select
                  value={formData.sessionTimeoutMinutes}
                  onChange={e => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={0}>ไม่หมดอายุ (คงเซสชันไว้)</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.require2FA}
                    onChange={e => setFormData({ ...formData, require2FA: e.target.checked })}
                    className="rounded text-cyan-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">บังคับใช้การยืนยันตัวตนหลายปัจจัย (MFA/2FA)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoBackupConfig}
                    onChange={e => setFormData({ ...formData, autoBackupConfig: e.target.checked })}
                    className="rounded text-cyan-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">สำรองค่ากำหนดอัตโนมัติทุกวันผ่าน TFTP/SCP</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

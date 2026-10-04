import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNetworkData } from '../../context/NetworkDataContext';
import { useAuth } from '../../context/AuthContext';
import { ConfigBackup, BackupPolicy } from '../../types';
import {
  HardDrive,
  Clock,
  Shield,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  Split,
  Play,
  CheckCircle2,
  AlertTriangle,
  Server,
  Search,
  Filter,
  Save,
  Lock,
  Copy,
  Check,
  X,
  FileCode2,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';

export const BackupManager: React.FC = () => {
  const { t } = useLanguage();
  const {
    devices,
    backups,
    isBackingUp,
    settings,
    updateSettings,
    deleteBackup,
    restoreBackup,
    runGlobalBackup,
    createBackup,
  } = useNetworkData();
  const { currentUser, isAdmin, isEngineer } = useAuth();

  // Policy Form State
  const [policy, setPolicy] = useState<BackupPolicy>({ ...settings.backupPolicy });
  const [policySaved, setPolicySaved] = useState(false);

  // Search & Filter in Archive
  const [search, setSearch] = useState('');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');

  // Modal States
  const [inspectModalBackup, setInspectModalBackup] = useState<ConfigBackup | null>(null);
  const [diffModalBackup, setDiffModalBackup] = useState<ConfigBackup | null>(null);
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<ConfigBackup | null>(null);
  const [deleteConfirmBackup, setDeleteConfirmBackup] = useState<ConfigBackup | null>(null);

  // Progress modal for Global Backup
  const [showGlobalProgress, setShowGlobalProgress] = useState(false);
  const [globalProgressPercent, setGlobalProgressPercent] = useState(0);
  const [globalCurrentDevice, setGlobalCurrentDevice] = useState('');
  const [copiedChecksum, setCopiedChecksum] = useState<string | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Notification Banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  // Save Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('เฉพาะบัญชีผู้ดูแลระบบเท่านั้นที่แก้ไขนโยบายสำรองข้อมูลอัตโนมัติได้');
      return;
    }
    updateSettings({ backupPolicy: policy });
    setPolicySaved(true);
    showNotification(t('settingsSaved'));
    setTimeout(() => setPolicySaved(false), 2500);
  };

  // Run Global Backup
  const handleRunGlobalBackup = async () => {
    setShowGlobalProgress(true);
    setGlobalProgressPercent(0);
    setGlobalCurrentDevice(devices[0]?.name || 'กำลังเริ่มต้น...');

    const author = currentUser ? `${currentUser.name} (${currentUser.role})` : 'ผู้ดำเนินการ';
    await runGlobalBackup(author, (pct, devName) => {
      setGlobalProgressPercent(pct);
      setGlobalCurrentDevice(devName);
    });

    setTimeout(() => {
      setShowGlobalProgress(false);
      showNotification(t('globalBackupSuccess'));
    }, 800);
  };

  // Restore Backup
  const handleConfirmRestore = () => {
    if (!restoreConfirmBackup) return;
    const author = currentUser ? `${currentUser.name} (${currentUser.role})` : 'ผู้ดำเนินการ';
    restoreBackup(restoreConfirmBackup.id, author);
    setRestoreConfirmBackup(null);
    showNotification(t('restoreSuccess'));
  };

  // Delete Backup
  const handleConfirmDelete = () => {
    if (!deleteConfirmBackup) return;
    if (!isAdmin) {
      alert('เฉพาะบัญชีผู้ดูแลระบบเท่านั้นที่ลบคลังข้อมูลสำรองย้อนหลังได้');
      return;
    }
    deleteBackup(deleteConfirmBackup.id);
    setDeleteConfirmBackup(null);
    showNotification('ลบข้อมูลสำรองออกจากคลังเรียบร้อยแล้ว');
  };

  // Download Config File
  const handleDownload = (backup: ConfigBackup) => {
    const blob = new Blob([backup.configContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = backup.deviceName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTag = backup.versionTag.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `${safeName}_${safeTag}.cfg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Checksum or Content
  const handleCopy = (text: string, isHash: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isHash) {
      setCopiedChecksum(text);
      setTimeout(() => setCopiedChecksum(null), 2000);
    } else {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    }
  };

  // Calculate Health Metrics
  const totalBackupsCount = backups.length;
  const uniqueDeviceIdsBackedUp = new Set(backups.map(b => b.deviceId)).size;
  const totalStorageKb = backups.reduce((acc, b) => acc + (b.sizeKb || 12), 0);
  const lastBackupTimestamp =
    settings.backupPolicy.lastGlobalBackup || (backups[0] ? backups[0].timestamp : 'N/A');

  // Filtered Archive List
  const filteredBackups = backups.filter(b => {
    const matchesSearch =
      b.deviceName.toLowerCase().includes(search.toLowerCase()) ||
      b.deviceIp.includes(search) ||
      b.versionTag.toLowerCase().includes(search.toLowerCase()) ||
      b.checksumSha256.toLowerCase().includes(search.toLowerCase()) ||
      b.triggeredBy.toLowerCase().includes(search.toLowerCase());

    const matchesDevice = filterDevice === 'all' || b.deviceId === filterDevice;
    const matchesTrigger = filterTrigger === 'all' || b.triggerType === filterTrigger;

    return matchesSearch && matchesDevice && matchesTrigger;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-cyan-500" />
            {t('backupManagerTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('backupManagerSub')}
          </p>
        </div>

        {/* Global Backup Trigger Button */}
        <button
          type="button"
          onClick={handleRunGlobalBackup}
          disabled={isBackingUp || !isAdmin && !isEngineer}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50"
        >
          {isBackingUp ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังสำรองข้อมูล...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('runGlobalBackup')}</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              {t('totalBackups')}
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totalBackupsCount}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              {t('protectedDevices')}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {uniqueDeviceIdsBackedUp} / {devices.length}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                {Math.round((uniqueDeviceIdsBackedUp / Math.max(1, devices.length)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              {t('lastBackupTime')}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate block max-w-[140px]">
              {lastBackupTimestamp}
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              {t('storageUsage')}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {(totalStorageKb / 1024).toFixed(2)} MB
              </span>
              <span className="text-[10px] text-slate-400">/ 10 GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Automated Backup Policy Configuration */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            <span>{t('backupPolicyTitle')}</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {policy.enabled ? 'สถานะ: เปิดใช้กำหนดเวลา' : 'สถานะ: ปิดใช้งาน'}
          </span>
        </div>

        <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Frequency */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                {t('backupFrequency')}
              </label>
              <select
                value={policy.frequency}
                onChange={e => setPolicy({ ...policy, frequency: e.target.value as any })}
                disabled={!isAdmin}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:outline-none"
              >
                <option value="daily">{t('dailyAt')} 02:00 AM</option>
                <option value="weekly">{t('weeklyAt')}</option>
                <option value="hourly">{t('hourly')}</option>
                <option value="on_change">{t('onChange')}</option>
              </select>
            </div>

            {/* Protocol */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                {t('backupProtocol')}
              </label>
              <select
                value={policy.protocol}
                onChange={e => setPolicy({ ...policy, protocol: e.target.value as any })}
                disabled={!isAdmin}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
              >
                <option value="SCP">SCP (โปรโตคอลคัดลอกที่ปลอดภัย - แนะนำ)</option>
                <option value="SFTP">SFTP (โอนไฟล์ผ่าน SSH)</option>
                <option value="HTTPS">HTTPS (REST Management API)</option>
                <option value="TFTP">TFTP (โปรโตคอล FTP แบบเดิม)</option>
              </select>
            </div>

            {/* Remote Server IP */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                {t('remoteServerIp')}
              </label>
              <input
                type="text"
                value={policy.serverIp}
                onChange={e => setPolicy({ ...policy, serverIp: e.target.value })}
                disabled={!isAdmin}
                placeholder="10.10.100.250"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
              >
              </input>
            </div>

            {/* Server Port */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                {t('serverPort')}
              </label>
              <input
                type="number"
                value={policy.serverPort}
                onChange={e => setPolicy({ ...policy, serverPort: parseInt(e.target.value) || 22 })}
                disabled={!isAdmin}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Storage Path */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                {t('remotePath')}
              </label>
              <input
                type="text"
                value={policy.storagePath}
                onChange={e => setPolicy({ ...policy, storagePath: e.target.value })}
                disabled={!isAdmin}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            {/* Retention */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                {t('retentionPolicy')}
              </label>
              <select
                value={policy.retentionRevisions}
                onChange={e => setPolicy({ ...policy, retentionRevisions: parseInt(e.target.value) || 30 })}
                disabled={!isAdmin}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
              >
                <option value={15}>15 {t('revisions')}</option>
                <option value={30}>30 {t('revisions')} (Standard 1-Month)</option>
                <option value={60}>60 {t('revisions')} (2-Months Retention)</option>
                <option value={90}>90 {t('revisions')} (Quarterly Compliance)</option>
              </select>
            </div>

            {/* Security Toggles */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={policy.enableEncryption}
                  onChange={e => setPolicy({ ...policy, enableEncryption: e.target.checked })}
                  disabled={!isAdmin}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-500" />
                  {t('enableEncryption')}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={policy.autoPurgeOld}
                  onChange={e => setPolicy({ ...policy, autoPurgeOld: e.target.checked })}
                  disabled={!isAdmin}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t('autoPurge')}
                </span>
              </label>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('saveSettings')}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Section 2: Configuration Backup Archive & Repository Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>{t('backupArchiveTitle')}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-semibold">
                ข้อมูลสำรอง {filteredBackups.length} ชุด
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาคลังข้อมูล IP หรือ checksum..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Filter by device */}
            <select
              value={filterDevice}
              onChange={e => setFilterDevice(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">อุปกรณ์ทั้งหมด</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ip})
                </option>
              ))}
            </select>

            {/* Filter by trigger */}
            <select
              value={filterTrigger}
              onChange={e => setFilterTrigger(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">ทุกประเภทการทำงาน</option>
              <option value="scheduled">ตามกำหนดเวลา (CRON)</option>
              <option value="manual">สั่งทำงานด้วยตนเอง</option>
              <option value="pre-change">สำรองก่อนเปลี่ยนแปลง</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">อุปกรณ์และ IP</th>
                <th className="py-3 px-3">{t('versionTag')}</th>
                <th className="py-3 px-3">{t('backupTimestamp')}</th>
                <th className="py-3 px-3">{t('fileSize')}</th>
                <th className="py-3 px-3">{t('checksum')}</th>
                <th className="py-3 px-3">{t('triggeredBy')}</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No configuration backups found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBackups.map(bk => (
                  <tr
                    key={bk.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Device & IP */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {bk.deviceName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {bk.deviceIp}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Version & Tag */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{bk.versionTag}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        {bk.format.toUpperCase()}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {bk.timestamp}
                    </td>

                    {/* Size */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {bk.sizeKb} KB
                    </td>

                    {/* Checksum SHA-256 */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(bk.checksumSha256, true)}
                        className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 group"
                        title="Click to copy full SHA-256 hash"
                      >
                        <span>{bk.checksumSha256.slice(0, 10)}...</span>
                        {copiedChecksum === bk.checksumSha256 ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>

                    {/* Triggered By */}
                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {bk.triggeredBy}
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          bk.triggerType === 'scheduled'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                            : bk.triggerType === 'pre-change'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {bk.triggerType}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Config */}
                        <button
                          type="button"
                          onClick={() => setInspectModalBackup(bk)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-600 transition-colors"
                          title={t('viewConfig')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Compare Diff */}
                        <button
                          type="button"
                          onClick={() => setDiffModalBackup(bk)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-600 transition-colors"
                          title={t('compareDiff')}
                        >
                          <Split className="w-3.5 h-3.5" />
                        </button>

                        {/* Download .cfg */}
                        <button
                          type="button"
                          onClick={() => handleDownload(bk)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                          title={t('downloadConfig')}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Restore to Device */}
                        <button
                          type="button"
                          disabled={!isAdmin && !isEngineer}
                          onClick={() => setRestoreConfirmBackup(bk)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 transition-colors disabled:opacity-40"
                          title={t('restoreConfig')}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete (Admin only) */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmBackup(bk)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition-colors"
                            title={t('deleteBackup')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Inspect Config */}
      {inspectModalBackup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm">
                  {inspectModalBackup.deviceName} — {inspectModalBackup.versionTag}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  [{inspectModalBackup.deviceIp}]
                </span>
              </div>
              <button
                onClick={() => setInspectModalBackup(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>SHA-256: {inspectModalBackup.checksumSha256}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(inspectModalBackup.configContent)}
                    className="flex items-center gap-1 text-cyan-500 hover:underline"
                  >
                    {copiedConfig ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกสคริปต์</span>
                      </>
                    )}
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDownload(inspectModalBackup)}
                    className="flex items-center gap-1 text-cyan-500 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดไฟล์ .cfg</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[450px]">
                <pre>{inspectModalBackup.configContent}</pre>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalBackup(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Compare Diff with Running Config */}
      {diffModalBackup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm">
                  เปรียบเทียบ: ข้อมูลสำรอง [{diffModalBackup.versionTag}] กับ Running Config ปัจจุบัน
                </span>
              </div>
              <button
                onClick={() => setDiffModalBackup(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  อุปกรณ์เป้าหมาย: {diffModalBackup.deviceName} ({diffModalBackup.deviceIp})
                </span>
                <span className="text-slate-400">
                  Green = in backup archive • Red = in current running-config
                </span>
              </div>

              {(() => {
                const dev = devices.find(d => d.id === diffModalBackup.deviceId);
                const runningLines = (dev?.config || '').split('\n');
                const backupLines = diffModalBackup.configContent.split('\n');
                const runningSet = new Set(runningLines.map(l => l.trim()));
                const backupSet = new Set(backupLines.map(l => l.trim()));

                const diff: { type: 'added' | 'removed' | 'same'; text: string }[] = [];

                backupLines.forEach(l => {
                  if (l.trim() && !runningSet.has(l.trim())) {
                    diff.push({ type: 'added', text: l });
                  } else {
                    diff.push({ type: 'same', text: l });
                  }
                });

                runningLines.forEach(l => {
                  if (l.trim() && !backupSet.has(l.trim())) {
                    diff.push({ type: 'removed', text: l });
                  }
                });

                return (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs overflow-y-auto max-h-[460px] space-y-0.5">
                    {diff.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start px-2 py-0.5 rounded ${
                          item.type === 'added'
                            ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                            : item.type === 'removed'
                            ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="w-5 select-none font-bold">
                          {item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '}
                        </span>
                        <span className="whitespace-pre-wrap">{item.text}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setDiffModalBackup(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Restore */}
      {restoreConfirmBackup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {t('confirmRestore')}
                </h3>
                <p className="text-xs text-slate-500">
                  This will rewrite the running-config on the target hardware node.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
              <div>
                <span className="text-slate-500">อุปกรณ์:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-white">
                  {restoreConfirmBackup.deviceName} ({restoreConfirmBackup.deviceIp})
                </span>
              </div>
              <div>
                <span className="text-slate-500">เวอร์ชัน:</span>{' '}
                <span className="text-cyan-500">{restoreConfirmBackup.versionTag}</span>
              </div>
              <div>
                <span className="text-slate-500">วันที่จัดเก็บ:</span>{' '}
                <span>{restoreConfirmBackup.timestamp}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmBackup(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm"
              >
                ยืนยันการคืนค่ากำหนด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Delete Backup */}
      {deleteConfirmBackup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  ลบชุดข้อมูลสำรองหรือไม่?
                </h3>
                <p className="text-xs text-slate-500">{t('deleteBackupConfirm')}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
              <div>
                <span className="text-slate-500">เวอร์ชัน:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-white">
                  {deleteConfirmBackup.versionTag}
                </span>
              </div>
              <div>
                <span className="text-slate-500">อุปกรณ์:</span>{' '}
                <span>
                  {deleteConfirmBackup.deviceName} ({deleteConfirmBackup.deviceIp})
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBackup(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
              >
                ลบถาวร
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Global Backup Live Progress */}
      {showGlobalProgress && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto animate-pulse">
              <Terminal className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base">{t('globalBackupRunning')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connecting via {settings.backupPolicy.protocol} to devices on subnet 10.10.0.0/16
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-cyan-400">
                <span>{globalCurrentDevice}</span>
                <span>{globalProgressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${globalProgressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Executing `show running-config` • Computing SHA-256 Checksums
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

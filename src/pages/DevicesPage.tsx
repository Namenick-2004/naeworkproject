import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNetworkData } from '../context/NetworkDataContext';
import { useAuth } from '../context/AuthContext';
import { ConfigImportModal } from '../components/devices/ConfigImportModal';
import {
  Server,
  Plus,
  Search,
  Filter,
  FileCode2,
  Network,
  Trash2,
  Edit,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  X,
  Shield,
  Layers,
  HardDrive,
} from 'lucide-react';
import { NetworkDevice, DeviceType } from '../types';

export const DevicesPage: React.FC = () => {
  const { t } = useLanguage();
  const { devices, addDevice, updateDevice, deleteDevice, createBackup } = useNetworkData();
  const { currentUser, isAdmin, isEngineer, isViewer } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeDeviceForConfig, setActiveDeviceForConfig] = useState<NetworkDevice | null>(null);
  const [quickBackupMessage, setQuickBackupMessage] = useState<string | null>(null);

  // Add Device Form State
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    mac: '',
    type: 'Edge Switch' as DeviceType,
    vendor: 'Cisco Systems',
    model: 'Catalyst 9200-24P',
    location: 'Building B - IDF 2',
    rack: 'Rack-B2',
    status: 'online' as 'online' | 'warning' | 'offline',
    cpu: 18,
    ram: 32,
    temp: 34,
    portsTotal: 24,
    portsUp: 20,
    pingMs: 1.1,
    firmware: 'Cisco IOS-XE 17.09.01',
    snmpCommunity: 'public_ro',
  });

  const filteredDevices = devices.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.ip.includes(search) ||
      d.vendor.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || d.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenConfigModal = (device: NetworkDevice) => {
    setActiveDeviceForConfig(device);
    setShowConfigModal(true);
  };

  const handleQuickBackup = (device: NetworkDevice) => {
    const author = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Operator';
    const tag = `Manual Quick-Snapshot (${new Date().toLocaleTimeString('en-US', { hour12: false })})`;
    createBackup(device.id, tag, 'manual', author, `Quick snapshot taken from device inventory row`);
    setQuickBackupMessage(`Snapshot archived for ${device.name} [${device.ip}]`);
    setTimeout(() => setQuickBackupMessage(null), 3000);
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    addDevice(newDevice);
    setShowAddModal(false);
    setNewDevice({
      name: '',
      ip: '',
      mac: '',
      type: 'Edge Switch',
      vendor: 'Cisco Systems',
      model: 'Catalyst 9200-24P',
      location: 'Building B - IDF 2',
      rack: 'Rack-B2',
      status: 'online',
      cpu: 18,
      ram: 32,
      temp: 34,
      portsTotal: 24,
      portsUp: 20,
      pingMs: 1.1,
      firmware: 'Cisco IOS-XE 17.09.01',
      snmpCommunity: 'public_ro',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Online
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Warning
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Offline
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Server className="w-6 h-6 text-cyan-500" />
            {t('devicesInventory')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise hardware nodes inventory (Routers, Core/Dist/Edge Switches, Firewalls & Server Clusters)
          </p>
        </div>

        {/* Action Buttons: Import Config & Add Device */}
        <div className="flex items-center gap-2">
          {!isViewer && (
            <button
              onClick={() => {
                setActiveDeviceForConfig(null);
                setShowConfigModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
            >
              <FileCode2 className="w-4 h-4 text-cyan-500" />
              <span>{t('configImportTitle')}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addDevice')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Backup Toast Banner */}
      {quickBackupMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{quickBackupMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-400">ดูที่ ตั้งค่า &gt; ตัวจัดการสำรองข้อมูลอัตโนมัติ</span>
        </div>
      )}

      {/* Role notice for Viewer */}
      {isViewer && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{t('readOnlyNotice')}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="กรองตามชื่ออุปกรณ์ IP รุ่น หรือสถานที่..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-500 text-[11px] whitespace-nowrap">{t('deviceTypeFilter')}:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{t('allTypes')}</option>
              <option value="Router">เราเตอร์</option>
              <option value="Core Switch">คอร์สวิตช์</option>
              <option value="Distribution Switch">ดิสทริบิวชันสวิตช์</option>
              <option value="Edge Switch">เอดจ์สวิตช์</option>
              <option value="Firewall">ไฟร์วอลล์</option>
              <option value="Server">เซิร์ฟเวอร์</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-500 text-[11px] whitespace-nowrap">{t('statusFilter')}:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="online">ออนไลน์</option>
              <option value="warning">มีคำเตือน</option>
              <option value="offline">ออฟไลน์</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hardware Devices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">{t('deviceName')}</th>
                <th className="py-3 px-4">{t('ipAddress')}</th>
                <th className="py-3 px-4">{t('type')}</th>
                <th className="py-3 px-4">{t('modelVendor')}</th>
                <th className="py-3 px-4">{t('locationRack')}</th>
                <th className="py-3 px-4 text-center">{t('statusFilter')}</th>
                <th className="py-3 px-4 text-right">{t('uptime')}</th>
                <th className="py-3 px-4 text-right">{t('cpuRam')}</th>
                <th className="py-3 px-4 text-right">{t('portsUp')}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No hardware devices matching current filters
                  </td>
                </tr>
              ) : (
                filteredDevices.map(device => (
                  <tr
                    key={device.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Device Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {device.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{device.mac}</div>
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                      {device.ip}
                    </td>

                    {/* Category Type */}
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {device.type}
                      </span>
                    </td>

                    {/* Model & Vendor */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{device.model}</div>
                      <div className="text-[10px] text-slate-400">{device.vendor}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <div>{device.location}</div>
                      <div className="text-[10px] font-mono text-slate-400">{device.rack}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">{getStatusBadge(device.status)}</td>

                    {/* Uptime */}
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {device.uptime}
                    </td>

                    {/* CPU & RAM */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className={device.cpu > 80 ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        CPU: {device.cpu}%
                      </div>
                      <div className="text-[10px] text-slate-400">RAM: {device.ram}%</div>
                    </td>

                    {/* Ports UP / Total */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{device.portsUp}</span>
                      <span className="text-slate-400"> / {device.portsTotal}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Inspect Ports (All Roles) */}
                        <button
                          onClick={() => navigate(`/ports?device=${encodeURIComponent(device.id)}`)}
                          title={t('inspectPorts')}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition-colors"
                        >
                          <Network className="w-3.5 h-3.5" />
                        </button>

                        {/* Import Config (Admin & Engineer) */}
                        {(isAdmin || isEngineer) && (
                          <button
                            onClick={() => handleOpenConfigModal(device)}
                            title={t('importConfig')}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <FileCode2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Quick Backup Snapshot (Admin & Engineer) */}
                        {(isAdmin || isEngineer) && (
                          <button
                            onClick={() => handleQuickBackup(device)}
                            title="Take Immediate Config Snapshot"
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Device (Admin ONLY) */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`ยืนยันการลบ ${device.name} หรือไม่?`)) {
                                deleteDevice(device.id);
                              }
                            }}
                            title={t('deleteDevice')}
                            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors"
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

      {/* Modal: Add Device (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-500" />
                {t('addDevice')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('deviceName')}</label>
                  <input
                    type="text"
                    required
                    value={newDevice.name}
                    onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                    placeholder="เช่น Edge-SW-Floor3"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('ipAddress')}</label>
                  <input
                    type="text"
                    required
                    value={newDevice.ip}
                    onChange={e => setNewDevice({ ...newDevice, ip: e.target.value })}
                    placeholder="10.10.10.25"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('type')}</label>
                  <select
                    value={newDevice.type}
                    onChange={e => setNewDevice({ ...newDevice, type: e.target.value as DeviceType })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Router">เราเตอร์</option>
                    <option value="Core Switch">คอร์สวิตช์</option>
                    <option value="Distribution Switch">ดิสทริบิวชันสวิตช์</option>
                    <option value="Edge Switch">เอดจ์สวิตช์</option>
                    <option value="Firewall">ไฟร์วอลล์</option>
                    <option value="Server">เซิร์ฟเวอร์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">รุ่น / ซีรีส์</label>
                  <input
                    type="text"
                    required
                    value={newDevice.model}
                    onChange={e => setNewDevice({ ...newDevice, model: e.target.value })}
                    placeholder="Catalyst 9300-48P"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('locationRack')}</label>
                  <input
                    type="text"
                    required
                    value={newDevice.location}
                    onChange={e => setNewDevice({ ...newDevice, location: e.target.value })}
                    placeholder="อาคาร B - ชั้น 3"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">ตำแหน่งตู้แร็ค</label>
                  <input
                    type="text"
                    required
                    value={newDevice.rack}
                    onChange={e => setNewDevice({ ...newDevice, rack: e.target.value })}
                    placeholder="Rack-B3 (Unit 10)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enhanced Configuration Import & Deployment */}
      <ConfigImportModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setActiveDeviceForConfig(null);
        }}
        targetDevice={activeDeviceForConfig}
      />
    </div>
  );
};

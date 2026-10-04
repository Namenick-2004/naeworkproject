import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNetworkData } from '../context/NetworkDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Server,
  Activity,
  AlertTriangle,
  Wifi,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  GitFork,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { devices, accessPoints, clients, alerts, vlans, refreshTelemetry, isTelemetrySyncing } = useNetworkData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.status === 'online').length;
  const issueDevices = devices.filter(d => d.status !== 'online').length;
  const activeAps = accessPoints.filter(ap => ap.status === 'online').length;
  const totalClients = 1480; // Scaled enterprise representation
  const activeCriticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active');

  // Realistic telemetry data points (Gbps)
  const trafficData = [
    { time: '12:00', inbound: 4.8, outbound: 3.2 },
    { time: '13:00', inbound: 5.4, outbound: 3.8 },
    { time: '14:00', inbound: 6.9, outbound: 4.5 },
    { time: '15:00', inbound: 7.8, outbound: 5.1 },
    { time: '16:00', inbound: 8.6, outbound: 5.9 },
    { time: '17:00', inbound: 8.2, outbound: 5.4 },
  ];

  // CPU & RAM telemetry
  const resourceData = [
    { time: '12:00', cpu: 28, ram: 44 },
    { time: '13:00', cpu: 32, ram: 46 },
    { time: '14:00', cpu: 45, ram: 52 },
    { time: '15:00', cpu: 58, ram: 60 },
    { time: '16:00', cpu: 64, ram: 65 },
    { time: '17:00', cpu: 48, ram: 58 },
  ];

  // Top VLANs traffic consumption
  const vlanChartData = vlans.slice(0, 5).map(v => ({
    name: `VLAN ${v.id}`,
    traffic: v.trafficRateMbps,
    fullName: v.name,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('navDashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ชุดเครื่องมือตรวจวัด NOC ระดับองค์กรแบบ Cisco DNA Center และ PRTG · ยินดีต้อนรับ {currentUser?.name} ({currentUser?.role})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t('lastSyncTime')}: 17:10:00 UTC</span>
          </div>

          <button
            onClick={refreshTelemetry}
            disabled={isTelemetrySyncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTelemetrySyncing ? 'animate-spin' : ''}`} />
            <span>{t('refreshData')}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Hardware Nodes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('totalHardware')}</span>
            <Server className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalDevices * 24}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <span>เราเตอร์ สวิตช์ และไฟร์วอลล์</span>
          </div>
        </div>

        {/* Healthy Active Nodes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('activeNodes')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {activeDevices * 24}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
            <ArrowUpRight className="w-3 h-3" />
            <span>98.6% Operational</span>
          </div>
        </div>

        {/* Disconnected / Warning */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('disconnectedNodes')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 tabular-nums">
            {issueDevices}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-500 font-mono">
            <span>ประสิทธิภาพลดลง 1 · ออฟไลน์ 0</span>
          </div>
        </div>

        {/* Broadcasting APs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('broadcastingAPs')}</span>
            <Wifi className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {activeAps} / {accessPoints.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
            <span>Wi-Fi 6 และ 6E ที่ใช้งานอยู่</span>
          </div>
        </div>

        {/* Active Connected Clients */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('activeClients')}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalClients.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-500 font-mono">
            <ArrowUpRight className="w-3 h-3" />
            <span>+142 this hour</span>
          </div>
        </div>

        {/* Total Aggregate Throughput */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('totalThroughput')}</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
            8.6 <span className="text-xs font-normal text-slate-400">Gbps</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <span>40G Fiber Backbone</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Real-time Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Traffic Load Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                {t('telemetryTitle')}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Inbound WAN vs Outbound LAN Traffic Load
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span> Inbound (Peak 8.6 Gbps)
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Outbound (5.9 Gbps)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="G" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="inbound" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="outbound" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health & PRTG Scoreboard */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {t('systemHealth')}
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-500">96.4% NOMINAL</span>
            </div>

            {/* Health Meter Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full w-[96.4%] rounded-full"></div>
            </div>

            {/* Mini Probe Counters */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-600 dark:text-slate-300">สถานะการตรวจสอบ SNMP</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">148 / 148 Responding</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-600 dark:text-slate-300">การเชื่อมต่อ BGP หลัก</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">2 / 2 Established</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-600 dark:text-slate-300">การแจ้งเตือนสำคัญที่ยังดำเนินอยู่</span>
                <span className="font-mono text-rose-500 font-bold">วิกฤต {activeCriticalAlerts.length} รายการ</span>
              </div>
            </div>
          </div>

          {/* Interactive Topology Quick Preview Card */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                {t('topologyPreview')}
              </span>
              <button
                onClick={() => navigate('/topology')}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                <span>{t('viewFullTopology')}</span>
                <span>→</span>
              </button>
            </div>
            <div
              onClick={() => navigate('/topology')}
              className="py-3 px-3.5 rounded-xl border border-slate-200 hover:border-cyan-400/70 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 dark:from-slate-950/70 dark:via-slate-900/80 dark:to-slate-950/90 dark:border-slate-800 dark:hover:border-cyan-500/50 relative overflow-hidden cursor-pointer group flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md"
            >
              {/* Subtle network canvas grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40 dark:opacity-30 pointer-events-none"></div>
              <div className="absolute inset-0 bg-radial from-cyan-500/5 to-transparent pointer-events-none"></div>

              {/* Topology Nodes Flow: 3 Tiers (ISP/WAN, CORE, DIST) */}
              <div className="flex items-center justify-between relative z-10 py-1.5 px-2">
                {/* Tier 1: ISP / WAN Node */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900/90 border-blue-200/90 dark:border-blue-900/60 shadow-xs group-hover:border-blue-300 transition-colors">
                  <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-bold font-mono text-blue-700 dark:text-blue-300">ISP / WAN</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>

                {/* Connector 1: ISP to Core */}
                <div className="flex-1 mx-3 h-0.5 bg-slate-200 dark:bg-slate-700/80 relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-cyan-500/70 dark:bg-cyan-400/80 animate-pulse"></div>
                </div>

                {/* Tier 2: CORE Node (ชั้น คอ) */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900/90 border-cyan-200/90 dark:border-cyan-900/60 shadow-xs group-hover:border-cyan-300 transition-colors">
                  <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-bold font-mono text-cyan-700 dark:text-cyan-300">CORE (คอ)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>

                {/* Connector 2: Core to Dist */}
                <div className="flex-1 mx-3 h-0.5 bg-slate-200 dark:bg-slate-700/80 relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-cyan-500/70 dark:bg-cyan-400/80 animate-pulse"></div>
                </div>

                {/* Tier 3: DIST Node (ชั้น ดิส) */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900/90 border-purple-200/90 dark:border-purple-900/60 shadow-xs group-hover:border-purple-300 transition-colors">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-[11px] font-bold font-mono text-purple-700 dark:text-purple-300">DIST (ดิส)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              {/* Bottom Footer Details */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono relative z-10">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-sans font-medium">ทำงาน 3 ระดับ · แบ็กโบน 40G / 10G</span>
                </span>
                <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1 font-sans font-medium">
                  <span>{t('exploreTopologyPrompt')}</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top VLANs Usage & Critical Alerts Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top VLANs Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                {t('topVlansTitle')}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ปริมาณการใช้งานของเซกเมนต์ที่ทำงานอยู่ (Mbps)
              </span>
            </div>
            <button
              onClick={() => navigate('/vlans')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              {t('vlanAnalytics')} →
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vlanChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="M" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="traffic" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Alerts Incident Stream */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                {t('criticalIncidents')}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Actionable NOC alerts requiring investigation
              </span>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              {t('viewAllAlerts')} →
            </button>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 3).map(alert => (
              <div
                key={alert.id}
                onClick={() => navigate('/alerts')}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-500'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:border-amber-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        alert.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">{alert.deviceName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp.slice(11)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{alert.message}</p>
                {alert.notes.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>หมายเหตุ:</span>
                    <span className="italic truncate">{alert.notes[0].text}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

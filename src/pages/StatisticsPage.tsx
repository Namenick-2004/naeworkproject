import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, TrendingUp, PieChart as PieIcon, ArrowUpRight, Globe, Layers } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const StatisticsPage: React.FC = () => {
  const { t } = useLanguage();

  // 7-day cumulative bandwidth trends (Tb / day)
  const cumulativeData = [
    { day: 'จ.', inboundTb: 48.2, outboundTb: 34.6 },
    { day: 'อ.', inboundTb: 52.4, outboundTb: 38.1 },
    { day: 'พ.', inboundTb: 61.8, outboundTb: 44.5 },
    { day: 'พฤ.', inboundTb: 68.3, outboundTb: 49.2 },
    { day: 'ศ.', inboundTb: 74.9, outboundTb: 55.4 },
    { day: 'ส.', inboundTb: 32.1, outboundTb: 24.8 },
    { day: 'อา.', inboundTb: 29.5, outboundTb: 21.0 },
  ];

  // Protocol Distribution
  const protocolData = [
    { name: 'HTTPS / TLS', value: 48, color: '#06b6d4' },
    { name: 'QUIC / HTTP3', value: 22, color: '#3b82f6' },
    { name: 'VoIP (SIP/RTP)', value: 12, color: '#10b981' },
    { name: 'WireGuard / VPN', value: 8, color: '#8b5cf6' },
    { name: 'SSH & Telnet', value: 4, color: '#f59e0b' },
    { name: 'DNS / NTP / SNMP', value: 6, color: '#ec4899' },
  ];

  // Top Talkers ranking table
  const topTalkers = [
    { rank: 1, host: 'SRV-HyperV-Cluster-01', ip: '10.10.100.10', vlan: 'VLAN 100', transferred: '14.8 TB', packets: '8.4B', dominantProtocol: 'HTTPS/Storage' },
    { rank: 2, host: 'ThinkPad-T14-Researcher', ip: '10.10.50.198', vlan: 'VLAN 50', transferred: '4.2 TB', packets: '2.1B', dominantProtocol: 'SSH/Dataset' },
    { rank: 3, host: 'Dell-Precision-Lab-32', ip: '10.10.20.45', vlan: 'VLAN 20', transferred: '3.1 TB', packets: '1.6B', dominantProtocol: 'QUIC/Video' },
    { rank: 4, host: 'Axis-P3245-CCTV-Corridor', ip: '10.10.70.82', vlan: 'VLAN 70', transferred: '2.4 TB', packets: '1.2B', dominantProtocol: 'RTSP Stream' },
    { rank: 5, host: 'MacBook-Pro-Admin-04', ip: '10.10.50.114', vlan: 'VLAN 50', transferred: '1.9 TB', packets: '940M', dominantProtocol: 'HTTPS/Cloud' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-cyan-500" />
          {t('statsTitle')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          สถิติการรับส่งข้อมูล การวิเคราะห์โปรโตคอลแอปพลิเคชัน และอุปกรณ์ที่ใช้แบนด์วิดท์สูงสุด
        </p>
      </div>

      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Cumulative Bandwidth */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                {t('bandwidthTrends')}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ปริมาณข้อมูลที่รับส่งต่อวัน หน่วยเทราไบต์ (วันจันทร์ - วันอาทิตย์)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span> ข้อมูลขาเข้า (TB)
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> ข้อมูลขาออก (TB)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInTb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOutTb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" TB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="inboundTb" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorInTb)" />
                <Area type="monotone" dataKey="outboundTb" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOutTb)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-cyan-500" />
              {t('trafficDistribution')}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              สัดส่วนโปรโตคอลจากการตรวจสอบแพ็กเก็ตเชิงลึก (DPI)
            </span>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-200 dark:border-slate-800">
            {protocolData.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                <span className="text-slate-600 dark:text-slate-400 truncate">{p.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Talkers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            {t('topTalkers')}
          </h2>
          <span className="text-xs font-mono text-slate-500">จัดอันดับตามปริมาณข้อมูลเข้า/ออกใน 24 ชั่วโมง</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-16">อันดับ</th>
                <th className="py-3 px-4">ชื่อโฮสต์ / ลูกข่าย</th>
                <th className="py-3 px-4">{t('ipAddress')}</th>
                <th className="py-3 px-4">เซกเมนต์</th>
                <th className="py-3 px-4 text-right">ปริมาณข้อมูล</th>
                <th className="py-3 px-4 text-right">แพ็กเก็ต</th>
                <th className="py-3 px-4">ทราฟฟิกหลัก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {topTalkers.map(item => (
                <tr key={item.rank} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    #{item.rank}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {item.host}
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400">
                    {item.ip}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.vlan}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {item.transferred}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                    {item.packets}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {item.dominantProtocol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

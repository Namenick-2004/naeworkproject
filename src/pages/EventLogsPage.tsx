import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNetworkData } from '../context/NetworkDataContext';
import { FileText, Search, Download, Filter, Terminal } from 'lucide-react';
import { SyslogEntry } from '../types';

export const EventLogsPage: React.FC = () => {
  const { t } = useLanguage();
  const { syslogs } = useNetworkData();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');

  const filteredLogs = syslogs.filter(log => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.host.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.includes(search) ||
      log.tag.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesFacility = facilityFilter === 'all' || log.facility === facilityFilter;
    return matchesSearch && matchesSeverity && matchesFacility;
  });

  const handleExportCsv = () => {
    const header = 'Timestamp,Severity,Facility,Host,IP,Tag,Message\n';
    const rows = filteredLogs
      .map(
        l =>
          `"${l.timestamp}","${l.severity}","${l.facility}","${l.host}","${l.ip}","${l.tag}","${l.message.replace(
            /"/g,
            '""'
          )}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NetMonitor_Syslog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'emergency':
      case 'alert':
      case 'critical':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 font-bold';
      case 'error':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 font-semibold';
      case 'warning':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 font-semibold';
      case 'notice':
        return 'bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300 font-medium';
      case 'info':
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-500" />
            {t('syslogTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            RFC 5424 compliant system logging daemon stream with real-time audit trail
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all border border-slate-200 dark:border-slate-700"
        >
          <Download className="w-3.5 h-3.5 text-cyan-500" />
          <span>{t('exportLogs')}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchLogs')}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Severity */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] whitespace-nowrap">{t('severity')}:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกระดับความรุนแรง</option>
              <option value="critical">วิกฤต</option>
              <option value="error">ข้อผิดพลาด</option>
              <option value="warning">คำเตือน</option>
              <option value="notice">ประกาศ</option>
              <option value="info">ข้อมูล</option>
            </select>
          </div>

          {/* Facility */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] whitespace-nowrap">{t('facility')}:</span>
            <select
              value={facilityFilter}
              onChange={e => setFacilityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
            >
              <option value="all">ทุกหมวดระบบ</option>
              <option value="LOCAL7">LOCAL7</option>
              <option value="AUTH">AUTH</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="KERNEL">KERNEL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Syslog Stream Table */}
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-44">{t('timestamp')}</th>
                <th className="py-2.5 px-3 w-24">{t('severity')}</th>
                <th className="py-2.5 px-3 w-24">{t('facility')}</th>
                <th className="py-2.5 px-4 w-48">{t('hostIp')}</th>
                <th className="py-2.5 px-4 w-40">แท็กช่วยจำ</th>
                <th className="py-2.5 px-4">{t('logMessage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-[11px] tabular-nums">{log.timestamp}</td>
                  <td className="py-2.5 px-3 text-[11px]">
                    <span className={`inline-flex rounded-md px-2 py-1 ${getSeverityStyle(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">{log.facility}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{log.host}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">{log.ip}</span>
                  </td>
                  <td className="py-2.5 px-4 text-cyan-700 dark:text-cyan-300 text-[11px]">{log.tag}</td>
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-sans text-xs break-all">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

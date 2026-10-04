import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNetworkData } from '../context/NetworkDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Network,
  Activity,
  Layers,
  Zap,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Power,
  Server,
} from 'lucide-react';
import { PortInfo } from '../types';

export const PortsPage: React.FC = () => {
  const { t } = useLanguage();
  const { devices, topologyNodes, portsByDevice, togglePortState } = useNetworkData();
  const { isAdmin, isEngineer, isViewer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const switchTargets = useMemo(() => {
    const deviceTargets = devices.filter(device => device.type.includes('Switch')).map(device => ({
      id: device.id,
      name: device.name,
      ip: device.ip,
      vendor: device.vendor,
      model: device.model,
    }));
    const knownIps = new Set(deviceTargets.map(device => device.ip));
    const topologyTargets = topologyNodes
      .filter(node => (node.type === 'core_switch' || node.type === 'dist_switch') && !knownIps.has(node.ip))
      .map(node => ({
        id: node.id,
        name: node.label,
        ip: node.ip,
        vendor: 'Network Switch',
        model: node.model || 'Managed Switch',
      }));

    return [...topologyTargets, ...deviceTargets];
  }, [devices, topologyNodes]);

  const requestedDeviceId = searchParams.get('device');
  const requestedDeviceIp = searchParams.get('ip');
  const requestedTarget = switchTargets.find(device =>
    device.id === requestedDeviceId || (!!requestedDeviceIp && device.ip === requestedDeviceIp)
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    requestedTarget?.id || switchTargets[0]?.id || 'dev-core-01'
  );
  const [selectedPort, setSelectedPort] = useState<PortInfo | null>(null);

  const currentPorts = portsByDevice[selectedDeviceId] || [];
  const currentDevice = switchTargets.find(device => device.id === selectedDeviceId);

  useEffect(() => {
    const target = switchTargets.find(device =>
      device.id === requestedDeviceId || (!!requestedDeviceIp && device.ip === requestedDeviceIp)
    );
    if (target) {
      setSelectedDeviceId(target.id);
      setSelectedPort(null);
    }
  }, [requestedDeviceId, requestedDeviceIp, switchTargets]);

  useEffect(() => {
    if (!switchTargets.some(device => device.id === selectedDeviceId) && switchTargets[0]) {
      setSelectedDeviceId(switchTargets[0].id);
    }
  }, [selectedDeviceId, switchTargets]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setSelectedPort(null);
    const target = switchTargets.find(device => device.id === deviceId);
    setSearchParams(target ? { device: deviceId, ip: target.ip } : { device: deviceId });
  };

  // Group ports into Odd (top row: 1, 3, 5...) and Even (bottom row: 2, 4, 6...)
  const oddPorts = currentPorts.filter(p => p.id % 2 !== 0);
  const evenPorts = currentPorts.filter(p => p.id % 2 === 0);

  const getPortBgColor = (port: PortInfo) => {
    if (!port.adminUp || port.status === 'down') {
      return 'bg-slate-300 dark:bg-slate-700/60 border-slate-400 dark:border-slate-600 text-slate-500';
    }
    if (port.status === 'warning') {
      return 'bg-amber-500/20 border-amber-500 text-amber-500 hover:bg-amber-500/30';
    }
    if (port.portType === 'SFP+') {
      return 'bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500/30';
    }
    return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30';
  };

  const getPortIndicatorColor = (port: PortInfo) => {
    if (!port.adminUp || port.status === 'down') return 'bg-slate-400 dark:bg-slate-600';
    if (port.status === 'warning') return 'bg-amber-400 animate-pulse';
    if (port.portType === 'SFP+') return 'bg-purple-400 shadow-xs shadow-purple-500';
    return 'bg-emerald-400 shadow-xs shadow-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-cyan-500" />
            {t('switchPortMatrix')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visual physical RJ45 & SFP+ switch faceplate matrix with live telemetry diagnostics
          </p>
        </div>

        {/* Switch Hardware Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {t('selectSwitch')}
          </span>
          <select
            value={selectedDeviceId}
            onChange={e => handleDeviceChange(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {switchTargets.map(sw => (
              <option key={sw.id} value={sw.id}>
                {sw.name} ({sw.ip} - {sw.model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Switch Faceplate Container */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
        {/* Chassis Branding Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse"></div>
            <div>
              <div className="text-sm font-bold tracking-wider uppercase font-mono text-white flex items-center gap-2">
                <span>{currentDevice?.vendor}</span>
                <span className="text-cyan-400">{currentDevice?.model}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Hostname: {currentDevice?.name} · IP: {currentDevice?.ip} · Ports: {currentPorts.length}
              </div>
            </div>
          </div>

          {/* Faceplate Port Status Legend */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">{t('portUp')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
              <span className="text-slate-400">{t('portDown')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-amber-400">{t('portWarning')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-purple-400">10G SFP+</span>
            </div>
          </div>
        </div>

        {/* Physical Port Faceplate Matrix Grid (Dual Row) */}
        {currentPorts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">
            No interface port matrix provisioned for this device. Please select a Cisco or Aruba Switch.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[840px] bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-inner">
              {/* Top Row: Odd Ports (1, 3, 5...) */}
              <div className="grid grid-flow-col auto-cols-max gap-2 mb-2">
                {oddPorts.map(port => (
                  <button
                    key={port.id}
                    onClick={() => setSelectedPort(port)}
                    className={`w-10 h-12 rounded border flex flex-col items-center justify-between p-1 transition-all transform hover:scale-105 ${getPortBgColor(
                      port
                    )} ${selectedPort?.id === port.id ? 'ring-2 ring-cyan-400' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`w-1.5 h-1.5 rounded-full ${getPortIndicatorColor(port)}`}></span>
                      <span className="text-[9px] font-mono font-bold">{port.id}</span>
                    </div>
                    {/* RJ45 clip notch graphic */}
                    <div className="w-4 h-2 bg-slate-800 rounded-b-xs border-t border-slate-700"></div>
                    <div className="text-[8px] font-mono opacity-80">{port.vlan}</div>
                  </button>
                ))}
              </div>

              {/* Bottom Row: Even Ports (2, 4, 6...) */}
              <div className="grid grid-flow-col auto-cols-max gap-2">
                {evenPorts.map(port => (
                  <button
                    key={port.id}
                    onClick={() => setSelectedPort(port)}
                    className={`w-10 h-12 rounded border flex flex-col items-center justify-between p-1 transition-all transform hover:scale-105 ${getPortBgColor(
                      port
                    )} ${selectedPort?.id === port.id ? 'ring-2 ring-cyan-400' : ''}`}
                  >
                    {/* RJ45 clip notch top */}
                    <div className="w-4 h-2 bg-slate-800 rounded-t-xs border-b border-slate-700"></div>
                    <div className="text-[8px] font-mono opacity-80">{port.vlan}</div>
                    <div className="flex items-center justify-between w-full">
                      <span className={`w-1.5 h-1.5 rounded-full ${getPortIndicatorColor(port)}`}></span>
                      <span className="text-[9px] font-mono font-bold">{port.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 text-right text-[11px] text-slate-400 font-mono">
          Click any port icon to inspect real-time interface telemetry, VLAN tag, duplex, and connected MAC.
        </div>
      </div>

      {/* Port Detail Modal */}
      {selectedPort && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Modal Title */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getPortIndicatorColor(selectedPort)}`}
                ></div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    Port {selectedPort.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Switch: {currentDevice?.name} ({currentDevice?.ip})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPort(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diagnostic Fields Grid */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-0.5">
                    {t('operationalStatus')}
                  </span>
                  <span
                    className={`font-semibold font-mono ${
                      selectedPort.status === 'up'
                        ? 'text-emerald-500'
                        : selectedPort.status === 'warning'
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {selectedPort.status.toUpperCase()} ({selectedPort.adminUp ? 'Admin Up' : 'Admin Down'})
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-0.5">
                    {t('negotiatedSpeed')}
                  </span>
                  <span className="font-semibold font-mono text-cyan-600 dark:text-cyan-400">
                    {selectedPort.speed} ({selectedPort.duplex})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-0.5">
                    {t('vlanAssigned')}
                  </span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                    VLAN {selectedPort.vlan} ({selectedPort.vlanName})
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-0.5">
                    {t('poeDraw')}
                  </span>
                  <span className="font-semibold font-mono text-amber-500">
                    {selectedPort.poeWatts} Watts
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-0.5">
                  {t('inOutRate')}
                </span>
                <div className="flex items-center justify-between font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="text-cyan-500">RX: {selectedPort.inTrafficMbps} Mbps</span>
                  <span className="text-blue-500">TX: {selectedPort.outTrafficMbps} Mbps</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-0.5">
                  {t('connectedMacHost')}
                </span>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {selectedPort.connectedDevice || 'No LLDP neighbor / Disconnected'}
                </div>
                {selectedPort.connectedMac && (
                  <span className="font-mono text-[11px] text-slate-400">{selectedPort.connectedMac}</span>
                )}
              </div>

              {selectedPort.errorDiscards > 0 && (
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-500 text-xs flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{selectedPort.errorDiscards} Interface CRC/Discards Detected</span>
                </div>
              )}
            </div>

            {/* Admin Toggle State Action */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {isAdmin || isEngineer ? (
                <button
                  onClick={() => {
                    togglePortState(selectedDeviceId, selectedPort.id);
                    setSelectedPort(prev =>
                      prev
                        ? {
                            ...prev,
                            adminUp: !prev.adminUp,
                            status: !prev.adminUp ? 'up' : 'down',
                          }
                        : null
                    );
                  }}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                    selectedPort.adminUp
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{selectedPort.adminUp ? 'Disable Port (shutdown)' : 'Enable Port (no shutdown)'}</span>
                </button>
              ) : (
                <div className="text-center w-full text-slate-400 text-xs italic">
                  Read-only view: Administrative port toggling requires Engineer or Admin clearance.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

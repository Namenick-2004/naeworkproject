import { arrangeTopologyLayers } from '../data/topologyLayers';
import { FITM_NODES, FITM_LINKS } from '../data/fitmTopology';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  NetworkDevice,
  PortInfo,
  VlanInfo,
  AccessPoint,
  ClientSession,
  TopologyNode,
  TopologyLink,
  IncidentAlert,
  SyslogEntry,
  SystemSettings,
  Role,
  ConfigBackup,
} from '../types';

interface NetworkDataContextType {
  devices: NetworkDevice[];
  portsByDevice: Record<string, PortInfo[]>;
  vlans: VlanInfo[];
  accessPoints: AccessPoint[];
  clients: ClientSession[];
  topologyNodes: TopologyNode[];
  topologyLinks: TopologyLink[];
  alerts: IncidentAlert[];
  syslogs: SyslogEntry[];
  settings: SystemSettings;
  backups: ConfigBackup[];
  isBackingUp: boolean;
  addDevice: (device: Omit<NetworkDevice, 'id' | 'uptime' | 'lastSeen'>) => void;
  updateDevice: (id: string, updates: Partial<NetworkDevice>) => void;
  deleteDevice: (id: string) => void;
  importDeviceConfig: (
    id: string,
    configText: string,
    mode?: 'merge' | 'replace',
    enableRollback?: boolean,
    author?: string
  ) => { success: boolean; message: string; diffAdded: number; diffRemoved: number };
  createBackup: (
    deviceId: string,
    versionTag: string,
    triggerType: 'manual' | 'scheduled' | 'pre-change',
    author: string,
    notes?: string
  ) => ConfigBackup;
  deleteBackup: (backupId: string) => void;
  restoreBackup: (backupId: string, author: string) => void;
  runGlobalBackup: (author: string, onProgress?: (percent: number, currentDevice: string) => void) => Promise<void>;
  togglePortState: (deviceId: string, portId: number) => void;
  addVlan: (vlan: Omit<VlanInfo, 'activePorts' | 'trafficRateMbps'>) => void;
  rebootAccessPoint: (apId: string) => Promise<void>;
  updateTopologyNodePosition: (id: string, x: number, y: number) => void;
  updateTopologyNode: (id: string, updates: Partial<Pick<TopologyNode, 'label' | 'ip' | 'model' | 'location' | 'notes'>>) => void;
  updateTopologyLink: (id: string, updates: Partial<Pick<TopologyLink, 'speed' | 'notes' | 'linkType'>>) => void;
  deleteTopologyLink: (id: string) => void;
  addTopologyNode: (node: Omit<TopologyNode, 'id'>) => void;
  deleteTopologyNode: (id: string) => void;
  toggleSubtreeCollapse: (nodeId: string) => void;
  connectTopologyLink: (source: string, target: string, linkType: 'fiber_10g' | 'copper_1g' | 'fiber_40g' | 'trunk') => void;
  saveTopologyLayout: () => void;
  acknowledgeAlert: (alertId: string, noteText: string, author: string, role: Role) => void;
  resolveAlert: (alertId: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  refreshTelemetry: () => void;
  isTelemetrySyncing: boolean;
}

const INITIAL_DEVICES: NetworkDevice[] = [
  {
    id: 'dev-rtr-01',
    name: 'WAN-Edge-RTR-01',
    ip: '192.168.100.1',
    mac: '00:1A:2B:3C:4D:01',
    type: 'Router',
    vendor: 'Cisco Systems',
    model: 'Catalyst 8300-1N1S-4T2X',
    location: 'Building A - Datacenter Core',
    rack: 'Rack-A1 (Unit 42)',
    status: 'online',
    uptime: '148d 14h 22m',
    cpu: 24,
    ram: 42,
    temp: 38,
    portsTotal: 8,
    portsUp: 7,
    pingMs: 1.2,
    lastSeen: 'Just now',
    firmware: 'IOS-XE 17.09.03a',
    snmpCommunity: 'public_ro',
    config: 'hostname WAN-Edge-RTR-01\nip routing\ninterface GigabitEthernet0/0/0\n ip address 192.168.100.1 255.255.255.0\n no shutdown',
  },
  {
    id: 'dev-fw-01',
    name: 'Perimeter-NGFW-Cluster',
    ip: '192.168.100.2',
    mac: '00:1A:2B:3C:4D:02',
    type: 'Firewall',
    vendor: 'Fortinet',
    model: 'FortiGate 200F Enterprise',
    location: 'Building A - Datacenter Core',
    rack: 'Rack-A1 (Unit 40)',
    status: 'online',
    uptime: '210d 06h 11m',
    cpu: 31,
    ram: 58,
    temp: 41,
    portsTotal: 18,
    portsUp: 16,
    pingMs: 0.8,
    lastSeen: 'Just now',
    firmware: 'FortiOS 7.4.2-build0503',
    snmpCommunity: 'public_ro',
  },
  {
    id: 'dev-core-01',
    name: 'Core-L3-SW-01',
    ip: '10.10.0.1',
    mac: '00:1A:2B:3C:4D:03',
    type: 'Core Switch',
    vendor: 'Cisco Systems',
    model: 'Catalyst 9500-48Y4C High-Perf',
    location: 'Building A - Datacenter Core',
    rack: 'Rack-A2 (Unit 36)',
    status: 'online',
    uptime: '92d 19h 45m',
    cpu: 18,
    ram: 37,
    temp: 36,
    portsTotal: 48,
    portsUp: 44,
    pingMs: 0.4,
    lastSeen: 'Just now',
    firmware: 'Cisco IOS-XE 17.11.01',
    snmpCommunity: 'public_ro',
  },
  {
    id: 'dev-dist-01',
    name: 'Dist-SW-EastWing',
    ip: '10.10.0.2',
    mac: '00:1A:2B:3C:4D:04',
    type: 'Distribution Switch',
    vendor: 'Cisco Systems',
    model: 'Catalyst 9300-48UXM mGig PoE+',
    location: 'Building B - East IDF Room',
    rack: 'IDF-B1 (Unit 12)',
    status: 'online',
    uptime: '64d 02h 10m',
    cpu: 27,
    ram: 45,
    temp: 39,
    portsTotal: 48,
    portsUp: 38,
    pingMs: 1.5,
    lastSeen: 'Just now',
    firmware: 'Cisco IOS-XE 17.10.01',
    snmpCommunity: 'public_ro',
  },
  {
    id: 'dev-dist-02',
    name: 'Dist-SW-WestWing',
    ip: '10.10.0.3',
    mac: '00:1A:2B:3C:4D:05',
    type: 'Distribution Switch',
    vendor: 'Cisco Systems',
    model: 'Catalyst 9300-48P PoE+',
    location: 'Building C - West IDF Room',
    rack: 'IDF-C2 (Unit 14)',
    status: 'warning',
    uptime: '38d 14h 50m',
    cpu: 89,
    ram: 78,
    temp: 54,
    portsTotal: 48,
    portsUp: 34,
    pingMs: 4.8,
    lastSeen: 'Just now',
    firmware: 'Cisco IOS-XE 17.10.01',
    snmpCommunity: 'public_ro',
  },
  {
    id: 'dev-edge-01',
    name: 'Edge-SW-ComputerLab',
    ip: '10.10.10.15',
    mac: '00:1A:2B:3C:4D:06',
    type: 'Edge Switch',
    vendor: 'Aruba Networks',
    model: 'CX 6200F 48G Class 4 PoE',
    location: 'Building B - Lab Floor 2',
    rack: 'Rack-Lab2 (Unit 04)',
    status: 'online',
    uptime: '42d 08h 12m',
    cpu: 22,
    ram: 34,
    temp: 35,
    portsTotal: 48,
    portsUp: 41,
    pingMs: 2.1,
    lastSeen: 'Just now',
    firmware: 'AOS-CX 10.12.0006',
    snmpCommunity: 'public_ro',
  },
  {
    id: 'dev-srv-01',
    name: 'SRV-HyperV-Cluster-01',
    ip: '10.10.100.10',
    mac: '00:1A:2B:3C:4D:07',
    type: 'Server',
    vendor: 'Dell Technologies',
    model: 'PowerEdge R750xs Rack Server',
    location: 'Building A - Datacenter Core',
    rack: 'Rack-A3 (Unit 20)',
    status: 'online',
    uptime: '112d 04h 30m',
    cpu: 45,
    ram: 68,
    temp: 32,
    portsTotal: 8,
    portsUp: 6,
    pingMs: 0.3,
    lastSeen: 'Just now',
    firmware: 'iDRAC9 Enterprise 6.10',
    snmpCommunity: 'public_ro',
  },
];

const INITIAL_VLANS: VlanInfo[] = [
  { id: 10, name: 'MGMT-Infrastructure', subnet: '10.10.10.0/24', gateway: '10.10.10.1', activePorts: 32, dhcpTotal: 254, dhcpUsed: 48, trafficRateMbps: 240, status: 'active', description: 'เครือข่ายบริหารจัดการสวิตช์และเราเตอร์แบบ Out-of-Band' },
  { id: 20, name: 'CORP-Workstations', subnet: '10.10.20.0/23', gateway: '10.10.20.1', activePorts: 142, dhcpTotal: 510, dhcpUsed: 395, trafficRateMbps: 1840, status: 'active', description: 'คอมพิวเตอร์ตั้งโต๊ะและแล็ปท็อปขององค์กร' },
  { id: 30, name: 'VOIP-Telephony', subnet: '10.10.30.0/24', gateway: '10.10.30.1', activePorts: 64, dhcpTotal: 254, dhcpUsed: 78, trafficRateMbps: 120, status: 'active', description: 'โทรศัพท์ IP Cisco พร้อมลำดับความสำคัญ QoS DSCP 46' },
  { id: 50, name: 'WIFI-Corporate-Secure', subnet: '10.10.50.0/22', gateway: '10.10.50.1', activePorts: 28, dhcpTotal: 1022, dhcpUsed: 780, trafficRateMbps: 3450, status: 'active', description: 'เครือข่ายไร้สายพนักงาน WPA3 Enterprise 802.1X' },
  { id: 60, name: 'WIFI-Guest-Captive', subnet: '10.10.60.0/22', gateway: '10.10.60.1', activePorts: 28, dhcpTotal: 1022, dhcpUsed: 420, trafficRateMbps: 920, status: 'active', description: 'Wi-Fi ผู้มาเยือนแบบแยกเครือข่ายพร้อมเว็บพอร์ทัล' },
  { id: 70, name: 'IOT-Facilities-CCTV', subnet: '10.10.70.0/24', gateway: '10.10.70.1', activePorts: 48, dhcpTotal: 254, dhcpUsed: 112, trafficRateMbps: 880, status: 'active', description: 'กล้องวงจรปิด Axis ระบบควบคุมการเข้าออก และ HVAC' },
  { id: 100, name: 'SERVER-FARM-Core', subnet: '10.10.100.0/24', gateway: '10.10.100.1', activePorts: 24, dhcpTotal: 254, dhcpUsed: 84, trafficRateMbps: 2890, status: 'active', description: 'Domain Controller, SAN Storage และระบบ Virtualization' },
];

const INITIAL_APS: AccessPoint[] = [
  {
    id: 'ap-01',
    name: 'AP-Admin-BldgA-Fl1',
    ip: '10.10.10.51',
    mac: 'D4:20:B0:11:01:A1',
    location: 'Building A - Lobby & Reception',
    building: 'Building A (Admin)',
    floor: 'Floor 1',
    ssidList: ['KMUTNB-Enterprise', 'KMUTNB-Guest-Web'],
    channels: { band24: 6, band5: 36, band6: 69 },
    txPowerDbm: 20,
    channelWidthMhz: 80,
    rssiAvg: -58,
    connectedClients: 42,
    cpu: 28,
    ram: 44,
    retryRate: 2.1,
    status: 'online',
    model: 'Cisco Catalyst 9130AX Series Wi-Fi 6',
    uptime: '48d 10h 15m',
  },
  {
    id: 'ap-02',
    name: 'AP-Admin-BldgA-Fl2',
    ip: '10.10.10.52',
    mac: 'D4:20:B0:11:01:A2',
    location: 'Building A - Executive Meeting Suites',
    building: 'Building A (Admin)',
    floor: 'Floor 2',
    ssidList: ['KMUTNB-Enterprise'],
    channels: { band24: 1, band5: 52, band6: 85 },
    txPowerDbm: 18,
    channelWidthMhz: 80,
    rssiAvg: -52,
    connectedClients: 36,
    cpu: 24,
    ram: 38,
    retryRate: 1.4,
    status: 'online',
    model: 'Cisco Catalyst 9130AX Series Wi-Fi 6',
    uptime: '48d 10h 15m',
  },
  {
    id: 'ap-03',
    name: 'AP-Eng-Lab-01',
    ip: '10.10.10.53',
    mac: 'D4:20:B0:11:01:A3',
    location: 'Building B - High-Performance Lab 101',
    building: 'Building B (Engineering)',
    floor: 'Floor 1',
    ssidList: ['KMUTNB-Enterprise', 'KMUTNB-Research-IoT'],
    channels: { band24: 11, band5: 149, band6: 101 },
    txPowerDbm: 23,
    channelWidthMhz: 160,
    rssiAvg: -64,
    connectedClients: 68,
    cpu: 48,
    ram: 62,
    retryRate: 4.8,
    status: 'online',
    model: 'Aruba AP-635 Campus Wi-Fi 6E',
    uptime: '32d 04h 50m',
  },
  {
    id: 'ap-04',
    name: 'AP-Eng-Lab-02',
    ip: '10.10.10.54',
    mac: 'D4:20:B0:11:01:A4',
    location: 'Building B - Embedded Systems Lab 204',
    building: 'Building B (Engineering)',
    floor: 'Floor 2',
    ssidList: ['KMUTNB-Enterprise'],
    channels: { band24: 6, band5: 100 },
    txPowerDbm: 21,
    channelWidthMhz: 80,
    rssiAvg: -68,
    connectedClients: 54,
    cpu: 39,
    ram: 51,
    retryRate: 3.2,
    status: 'online',
    model: 'Aruba AP-635 Campus Wi-Fi 6E',
    uptime: '32d 04h 50m',
  },
  {
    id: 'ap-05',
    name: 'AP-Auditorium-GrandHall',
    ip: '10.10.10.55',
    mac: 'D4:20:B0:11:01:A5',
    location: 'Central Hall - Main Auditorium Stage',
    building: 'Central Complex',
    floor: 'Ground Floor',
    ssidList: ['KMUTNB-Enterprise', 'KMUTNB-Guest-Web'],
    channels: { band24: 1, band5: 44, band6: 37 },
    txPowerDbm: 24,
    channelWidthMhz: 80,
    rssiAvg: -71,
    connectedClients: 115,
    cpu: 72,
    ram: 79,
    retryRate: 8.5,
    status: 'warning',
    model: 'Ruckus R850 Wi-Fi 6 High-Density',
    uptime: '15d 18h 05m',
  },
  {
    id: 'ap-06',
    name: 'AP-Library-EastWing',
    ip: '10.10.10.56',
    mac: 'D4:20:B0:11:01:A6',
    location: 'Learning Center - Silent Study Zone',
    building: 'Library Center',
    floor: 'Floor 3',
    ssidList: ['KMUTNB-Enterprise', 'KMUTNB-Guest-Web'],
    channels: { band24: 11, band5: 60 },
    txPowerDbm: 17,
    channelWidthMhz: 40,
    rssiAvg: -55,
    connectedClients: 49,
    cpu: 26,
    ram: 40,
    retryRate: 1.8,
    status: 'online',
    model: 'Cisco Catalyst 9120AX Series',
    uptime: '72d 11h 20m',
  },
  {
    id: 'ap-07',
    name: 'AP-Outdoor-Courtyard',
    ip: '10.10.10.57',
    mac: 'D4:20:B0:11:01:A7',
    location: 'Campus Quad - Outdoor Canopy Plaza',
    building: 'Outdoor Zone',
    floor: 'Open Air',
    ssidList: ['KMUTNB-Guest-Web'],
    channels: { band24: 6, band5: 157 },
    txPowerDbm: 27,
    channelWidthMhz: 40,
    rssiAvg: -74,
    connectedClients: 29,
    cpu: 31,
    ram: 43,
    retryRate: 5.1,
    status: 'online',
    model: 'Cisco Catalyst 9124AX Outdoor IP67',
    uptime: '19d 07h 40m',
  },
  {
    id: 'ap-08',
    name: 'AP-Canteen-Dining',
    ip: '10.10.10.58',
    mac: 'D4:20:B0:11:01:A8',
    location: 'Student Center - Food Court',
    building: 'Student Union',
    floor: 'Floor 1',
    ssidList: ['KMUTNB-Enterprise', 'KMUTNB-Guest-Web'],
    channels: { band24: 1, band5: 116 },
    txPowerDbm: 22,
    channelWidthMhz: 80,
    rssiAvg: -66,
    connectedClients: 82,
    cpu: 44,
    ram: 57,
    retryRate: 3.9,
    status: 'online',
    model: 'Aruba AP-555 Wi-Fi 6',
    uptime: '28d 14h 10m',
  },
];

const INITIAL_CLIENTS: ClientSession[] = [
  { id: 'cli-01', hostname: 'MacBook-Pro-Admin-04', ip: '10.10.50.114', mac: 'BC:D0:74:3E:99:A1', connectedNode: 'AP-Admin-BldgA-Fl2', nodeType: 'AP', vlanId: 50, ssid: 'KMUTNB-Enterprise', band: '6 GHz', rssi: -48, rxRateMbps: 1850, txRateMbps: 1200, duration: '4h 12m', osVendor: 'Apple Inc.', osType: 'Apple', status: 'active' },
  { id: 'cli-02', hostname: 'Dell-Precision-Lab-32', ip: '10.10.20.45', mac: '70:B5:E8:4A:11:D3', connectedNode: 'Edge-SW-ComputerLab', nodeType: 'Switch', vlanId: 20, band: 'Ethernet', rssi: -20, rxRateMbps: 1000, txRateMbps: 1000, duration: '28h 05m', osVendor: 'Dell Technologies', osType: 'Windows', status: 'active' },
  { id: 'cli-03', hostname: 'iPhone-15-Pro-Dean', ip: '10.10.50.88', mac: 'F4:34:F0:8A:23:C9', connectedNode: 'AP-Admin-BldgA-Fl2', nodeType: 'AP', vlanId: 50, ssid: 'KMUTNB-Enterprise', band: '5 GHz', rssi: -54, rxRateMbps: 866, txRateMbps: 650, duration: '1h 45m', osVendor: 'Apple Inc.', osType: 'Apple', status: 'active' },
  { id: 'cli-04', hostname: 'ThinkPad-T14-Researcher', ip: '10.10.50.198', mac: '48:2A:E3:66:BB:04', connectedNode: 'AP-Eng-Lab-01', nodeType: 'AP', vlanId: 50, ssid: 'KMUTNB-Enterprise', band: '5 GHz', rssi: -62, rxRateMbps: 1200, txRateMbps: 840, duration: '6h 30m', osVendor: 'Lenovo', osType: 'Linux', status: 'active' },
  { id: 'cli-05', hostname: 'Samsung-Galaxy-S24-Ultra', ip: '10.10.60.102', mac: '2C:54:CF:91:EE:82', connectedNode: 'AP-Auditorium-GrandHall', nodeType: 'AP', vlanId: 60, ssid: 'KMUTNB-Guest-Web', band: '5 GHz', rssi: -72, rxRateMbps: 433, txRateMbps: 280, duration: '45m', osVendor: 'Samsung', osType: 'Android', status: 'active' },
  { id: 'cli-06', hostname: 'HP-ColorLaserJet-M553', ip: '10.10.70.40', mac: '00:1E:0B:AA:55:12', connectedNode: 'Dist-SW-EastWing', nodeType: 'Switch', vlanId: 70, band: 'Ethernet', rssi: -20, rxRateMbps: 100, txRateMbps: 100, duration: '142d 10m', osVendor: 'Hewlett-Packard', osType: 'IoT', status: 'idle' },
  { id: 'cli-07', hostname: 'Axis-P3245-CCTV-Corridor', ip: '10.10.70.82', mac: 'AC:CC:8E:12:44:90', connectedNode: 'Dist-SW-WestWing', nodeType: 'Switch', vlanId: 70, band: 'Ethernet', rssi: -20, rxRateMbps: 100, txRateMbps: 100, duration: '84d 18m', osVendor: 'Axis Communications', osType: 'IoT', status: 'active' },
  { id: 'cli-08', hostname: 'iPad-Air-DesignStudio', ip: '10.10.50.210', mac: '60:F8:1D:90:3A:45', connectedNode: 'AP-Library-EastWing', nodeType: 'AP', vlanId: 50, ssid: 'KMUTNB-Enterprise', band: '5 GHz', rssi: -58, rxRateMbps: 866, txRateMbps: 580, duration: '3h 14m', osVendor: 'Apple Inc.', osType: 'Apple', status: 'active' },
  { id: 'cli-09', hostname: 'ASUS-ROG-GamingLab-08', ip: '10.10.20.180', mac: '90:FB:A6:41:00:23', connectedNode: 'Edge-SW-ComputerLab', nodeType: 'Switch', vlanId: 20, band: 'Ethernet', rssi: -20, rxRateMbps: 1000, txRateMbps: 1000, duration: '12h 00m', osVendor: 'ASUSTeK', osType: 'Windows', status: 'active' },
  { id: 'cli-10', hostname: 'Pixel-8-Pro-Guest', ip: '10.10.60.144', mac: '34:7E:5C:DE:09:66', connectedNode: 'AP-Canteen-Dining', nodeType: 'AP', vlanId: 60, ssid: 'KMUTNB-Guest-Web', band: '2.4 GHz', rssi: -65, rxRateMbps: 144, txRateMbps: 110, duration: '22m', osVendor: 'Google LLC', osType: 'Android', status: 'active' },
  { id: 'cli-11', hostname: 'Cisco-CP-8845-DeanOffice', ip: '10.10.30.15', mac: '68:BD:AB:55:01:88', connectedNode: 'Core-L3-SW-01', nodeType: 'Switch', vlanId: 30, band: 'Ethernet', rssi: -20, rxRateMbps: 1000, txRateMbps: 1000, duration: '92d 19h', osVendor: 'Cisco Systems', osType: 'IoT', status: 'active' },
];

const INITIAL_TOPOLOGY_NODES = FITM_NODES;
const INITIAL_TOPOLOGY_LINKS = FITM_LINKS;

const INITIAL_ALERTS: IncidentAlert[] = [
  {
    id: 'alt-01',
    timestamp: '2026-09-28 16:52:10',
    deviceName: 'Dist-SW-WestWing',
    deviceIp: '10.10.0.3',
    severity: 'critical',
    category: 'High Resource Exhaustion',
    message: 'โหลด CPU เกิน 89% และอุณหภูมิภายในตัวเครื่องสูงถึง 54°C (เกณฑ์: 50°C) ตรวจพบอัตราการทิ้งแพ็กเก็ตจาก ARP inspection สูง',
    status: 'active',
    notes: [
      {
        id: 'note-01',
        author: 'Somchai Prasert (Admin)',
        role: 'Admin',
        timestamp: '2026-09-28 16:55:00',
        text: 'ตรวจพบทราฟฟิก Broadcast Storm บนพอร์ต Gi1/0/24 กำลังส่งทีมเข้าตรวจสอบตู้ IDF-C2',
      },
    ],
  },
  {
    id: 'alt-02',
    timestamp: '2026-09-28 16:30:45',
    deviceName: 'AP-Auditorium-GrandHall',
    deviceIp: '10.10.10.55',
    severity: 'warning',
    category: 'High Channel Saturation & Retries',
    message: 'อัตราการส่งเฟรมซ้ำสูงถึง 8.5% ขณะมีลูกข่ายเชื่อมต่อพร้อมกัน 115 เครื่อง และช่อง 44 (5GHz) ใช้งานเกิน 82%',
    status: 'acknowledged',
    acknowledgedBy: 'Kittisak Wongsuwan (Senior NOC Engineer)',
    acknowledgedAt: '2026-09-28 16:35:20',
    notes: [
      {
        id: 'note-02',
        author: 'Kittisak Wongsuwan (Senior NOC Engineer)',
        role: 'Engineer',
        timestamp: '2026-09-28 16:35:20',
        text: 'กำลังปรับจูน Radio Resource Management (RRM) และเปิด Band Steering บังคับไคลเอนต์ไปย่าน 6GHz เพื่อลดความหนาแน่น',
      },
    ],
  },
  {
    id: 'alt-03',
    timestamp: '2026-09-28 15:40:12',
    deviceName: 'Core-L3-SW-01',
    deviceIp: '10.10.0.1',
    severity: 'warning',
    category: 'Interface Optical Power Warning',
    message: 'กำลังรับของโมดูลแสง SFP+ Te1/1/2 ลดลงเหลือ -18.2 dBm ใกล้ถึงเกณฑ์ -20 dBm',
    status: 'acknowledged',
    acknowledgedBy: 'Somchai Prasert (Lead Admin)',
    acknowledgedAt: '2026-09-28 15:45:10',
    notes: [
      {
        id: 'note-03',
        author: 'Somchai Prasert (Lead Admin)',
        role: 'Admin',
        timestamp: '2026-09-28 15:45:10',
        text: 'สั่งการให้เจ้าหน้าที่เตรียมทำความสะอาดขั้วต่อ Fiber Optic LC connector ช่วง Maintenance window คืนนี้',
      },
    ],
  },
  {
    id: 'alt-04',
    timestamp: '2026-09-28 14:15:00',
    deviceName: 'Perimeter-NGFW-Cluster',
    deviceIp: '192.168.100.2',
    severity: 'info',
    category: 'Intrusion Prevention Event',
    message: 'ระบบ IPS บล็อกการสแกนพอร์ตจากภายนอกมายัง WAN IP 203.158.0.1 จากต้นทาง 45.142.214.88',
    status: 'resolved',
    notes: [],
  },
];

const INITIAL_SYSLOGS: SyslogEntry[] = [
  { id: 'log-01', timestamp: '2026-09-28 17:10:45', facility: 'LOCAL7', severity: 'Warning', host: 'Dist-SW-WestWing', ip: '10.10.0.3', tag: '%SYS-4-CPURISING', message: 'CPU utilization exceeds threshold (89% > 80%)' },
  { id: 'log-02', timestamp: '2026-09-28 17:08:12', facility: 'AUTH', severity: 'Info', host: 'Core-L3-SW-01', ip: '10.10.0.1', tag: '%SEC-6-AUTH_PASS', message: 'SSH user admin authenticated successfully from 10.10.10.114' },
  { id: 'log-03', timestamp: '2026-09-28 16:59:30', facility: 'SYSTEM', severity: 'Notice', host: 'AP-Admin-BldgA-Fl1', ip: '10.10.10.51', tag: '%DOT11-6-ASSOC', message: 'Station BC:D0:74:3E:99:A1 associated on radio 5GHz with SSID KMUTNB-Enterprise' },
  { id: 'log-04', timestamp: '2026-09-28 16:52:10', facility: 'KERNEL', severity: 'Critical', host: 'Dist-SW-WestWing', ip: '10.10.0.3', tag: '%ENVMON-1-TEMP_HIGH', message: 'Thermal sensor 1 reading 54C exceeds high warning ceiling 50C' },
  { id: 'log-05', timestamp: '2026-09-28 16:40:02', facility: 'LOCAL7', severity: 'Info', host: 'WAN-Edge-RTR-01', ip: '192.168.100.1', tag: '%BGP-5-ADJCHANGE', message: 'Neighbor 203.158.0.254 Up - BGP routing table refreshed' },
  { id: 'log-06', timestamp: '2026-09-28 16:30:45', facility: 'SYSTEM', severity: 'Warning', host: 'AP-Auditorium-GrandHall', ip: '10.10.10.55', tag: '%WLAN-4-HIGH_RETRY', message: 'Radio 1 retry rate 8.5% exceeded 5.0% SLA target' },
  { id: 'log-07', timestamp: '2026-09-28 16:15:22', facility: 'SYSTEM', severity: 'Notice', host: 'Core-L3-SW-01', ip: '10.10.0.1', tag: '%LINEPROTO-5-UPDOWN', message: 'Line protocol on Interface GigabitEthernet1/0/22, changed state to up' },
  { id: 'log-08', timestamp: '2026-09-28 15:55:10', facility: 'AUTH', severity: 'Notice', host: 'Perimeter-NGFW-Cluster', ip: '192.168.100.2', tag: '%FGT-5-VPN_IPSEC', message: 'IPsec tunnel TO_BRANCH_PATTAYA tunnel established' },
];

const INITIAL_SETTINGS: SystemSettings = {
  orgName: 'NetMonitor Enterprise NOC',
  gatewayIp: '10.10.0.1',
  timezone: 'Asia/Bangkok (UTC+07:00)',
  snmpInterval: 30,
  pingTimeoutMs: 1500,
  packetLossThreshold: 5,
  slackWebhook: '',
  telegramBotToken: '',
  telegramChatId: '',
  emailNotification: 'noc-alerts@kmutnb.ac.th',
  sessionTimeoutMinutes: 60,
  require2FA: false,
  autoBackupConfig: true,
  backupPolicy: {
    enabled: true,
    frequency: 'daily',
    scheduledTime: '02:00',
    scheduledDay: 'Sunday',
    protocol: 'SCP',
    serverIp: '10.10.100.250',
    serverPort: 22,
    storagePath: '/var/netmonitor/backups/devices/',
    username: 'netbackup_svc',
    retentionRevisions: 30,
    enableEncryption: true,
    encryptionAlgorithm: 'AES-256-GCM',
    autoPurgeOld: true,
    lastGlobalBackup: '2026-09-28 02:00:45',
  },
};

const generateMockSha256 = (content: string) => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b78${hex}`;
};

const INITIAL_BACKUPS: ConfigBackup[] = [
  {
    id: 'bk-01',
    deviceId: 'dev-rtr-01',
    deviceName: 'WAN-Edge-RTR-01',
    deviceIp: '192.168.100.1',
    deviceType: 'Router',
    versionTag: 'v1.4 - Auto-Scheduled Daily',
    timestamp: '2026-09-28 02:00:15',
    sizeKb: 18.4,
    checksumSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    triggeredBy: 'Auto-Scheduler (CRON)',
    triggerType: 'scheduled',
    format: 'cisco_ios',
    notes: 'Automated nightly snapshot via SCP to 10.10.100.250',
    configContent: `! Cisco IOS-XE Software, Version 17.09.03a
! Running configuration for WAN-Edge-RTR-01
hostname WAN-Edge-RTR-01
!
ip routing
ip domain name netmonitor.internal
!
interface GigabitEthernet0/0/0
 description Primary Uplink to ISP1
 ip address 203.158.0.2 255.255.255.252
 negotiation auto
!
interface GigabitEthernet0/0/1
 description Internal Perimeter Firewall Transit
 ip address 192.168.100.1 255.255.255.248
 ip ospf 1 area 0
 negotiation auto
!
router ospf 1
 router-id 192.168.100.1
 passive-interface GigabitEthernet0/0/0
!
router bgp 65001
 bgp log-neighbor-changes
 neighbor 203.158.0.1 remote-as 45265
 neighbor 203.158.0.1 description ISP-UPSTREAM-GATEWAY
!
line vty 0 4
 transport input ssh
 logging synchronous
end`,
  },
  {
    id: 'bk-02',
    deviceId: 'dev-rtr-01',
    deviceName: 'WAN-Edge-RTR-01',
    deviceIp: '192.168.100.1',
    deviceType: 'Router',
    versionTag: 'v1.3 - Pre-Maintenance BGP Multi-homing',
    timestamp: '2026-09-25 14:32:00',
    sizeKb: 17.8,
    checksumSha256: '9b4c2084df9a72d1a3c6130089c922579df2a611c0805178601c9bfa6a34df4e',
    triggeredBy: 'admin (Admin Root)',
    triggerType: 'pre-change',
    format: 'cisco_ios',
    notes: 'Snapshot taken before updating ISP prefix-lists',
    configContent: `! Cisco IOS-XE Software, Version 17.09.03a
hostname WAN-Edge-RTR-01
ip routing
interface GigabitEthernet0/0/0
 description Primary Uplink to ISP1
 ip address 203.158.0.2 255.255.255.252
!
interface GigabitEthernet0/0/1
 ip address 192.168.100.1 255.255.255.248
!
line vty 0 4
 transport input ssh
end`,
  },
  {
    id: 'bk-03',
    deviceId: 'dev-fw-01',
    deviceName: 'Perimeter-NGFW-Cluster',
    deviceIp: '192.168.100.2',
    deviceType: 'Firewall',
    versionTag: 'v2.2 - Scheduled Daily',
    timestamp: '2026-09-28 02:00:22',
    sizeKb: 34.6,
    checksumSha256: 'c83038a846b0a1a0980ff256bb83b63cc238b72506e7552aaeb1c888f4c45b74',
    triggeredBy: 'Auto-Scheduler (CRON)',
    triggerType: 'scheduled',
    format: 'fortios',
    notes: 'Routine automated backup via SFTP',
    configContent: `#config-version=FGT200F-7.4.2-build0503
config system global
    set hostname "Perimeter-NGFW-Cluster"
    set timezone 55
end
config system interface
    edit "port1"
        set alias "WAN-Transit"
        set ip 192.168.100.2 255.255.255.248
        set allowaccess ping ssh https
    next
    edit "port2"
        set alias "Core-SW-Trunk"
        set ip 10.10.0.254 255.255.255.0
        set allowaccess ping
    next
end
config firewall policy
    edit 1
        set name "Trust-To-Internet"
        set srcintf "port2"
        set dstintf "port1"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set schedule "always"
        set service "ALL"
        set nat enable
    next
end`,
  },
  {
    id: 'bk-04',
    deviceId: 'dev-core-01',
    deviceName: 'Core-L3-SW-01',
    deviceIp: '10.10.0.1',
    deviceType: 'Core Switch',
    versionTag: 'v3.0 - Scheduled Daily',
    timestamp: '2026-09-28 02:00:30',
    sizeKb: 28.5,
    checksumSha256: 'a4d2c882190823b18413b1f9b14b301c223cde80b91d92634e2c88f170f20cde',
    triggeredBy: 'Auto-Scheduler (CRON)',
    triggerType: 'scheduled',
    format: 'cisco_ios',
    notes: 'Standard core switch configuration snapshot',
    configContent: `! Cisco IOS-XE Software, Catalyst 9500
hostname Core-L3-SW-01
!
spanning-tree mode mst
spanning-tree extend system-id
!
vlan 10
 name MGMT
vlan 20
 name CORP-LAN
vlan 30
 name VOIP
vlan 50
 name WIFI-CORP
vlan 70
 name IOT-CCTV
vlan 100
 name SERVER
!
interface Vlan10
 ip address 10.10.10.1 255.255.255.0
!
interface Vlan20
 ip address 10.10.20.1 255.255.255.0
!
interface TenGigabitEthernet1/0/1
 description Trunk to Dist-SW-EastWing
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,50,70,100
!
interface TenGigabitEthernet1/0/2
 description Trunk to Dist-SW-WestWing
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,50,70,100
!
end`,
  },
  {
    id: 'bk-05',
    deviceId: 'dev-dist-01',
    deviceName: 'Dist-SW-EastWing',
    deviceIp: '10.10.0.2',
    deviceType: 'Distribution Switch',
    versionTag: 'v1.8 - VLAN 50 Wi-Fi Expansion',
    timestamp: '2026-09-27 11:20:15',
    sizeKb: 16.5,
    checksumSha256: '6e4798365287f3b894101e4a1a3bcf5e7b233a1e4c9f7a8b3e21a8d05541982b',
    triggeredBy: 'somsak.e (Engineer)',
    triggerType: 'manual',
    format: 'cisco_ios',
    notes: 'Added AP trunk ports on Gi1/0/20 - Gi1/0/24',
    configContent: `! Cisco IOS-XE Catalyst 9300
hostname Dist-SW-EastWing
interface GigabitEthernet1/0/1
 description Uplink to Core-L3-SW-01
 switchport mode trunk
!
interface range GigabitEthernet1/0/20 - 24
 description Access Point Connections
 switchport mode access
 switchport access vlan 50
 power inline auto
!
end`,
  },
  {
    id: 'bk-06',
    deviceId: 'dev-dist-02',
    deviceName: 'Dist-SW-WestWing',
    deviceIp: '10.10.0.3',
    deviceType: 'Distribution Switch',
    versionTag: 'v1.5 - Scheduled Daily',
    timestamp: '2026-09-28 02:00:45',
    sizeKb: 15.9,
    checksumSha256: '1d82f7c0018f3a558b9911e3b52a488e146743b179213bc54df67b2d5f07a721',
    triggeredBy: 'Auto-Scheduler (CRON)',
    triggerType: 'scheduled',
    format: 'cisco_ios',
    notes: 'Daily baseline backup',
    configContent: `! Cisco IOS-XE Catalyst 9300
hostname Dist-SW-WestWing
vlan 10,20,30,50,70,100
interface GigabitEthernet1/0/1
 switchport mode trunk
end`,
  },
];

// Generates 48 switch ports for a switch
const generateSwitchPorts = (totalPorts: number = 48): PortInfo[] => {
  const ports: PortInfo[] = [];
  const vlanPool = [10, 20, 30, 50, 70, 100];
  const vlanNames: Record<number, string> = {
    10: 'MGMT',
    20: 'CORP-LAN',
    30: 'VOIP',
    50: 'WIFI-CORP',
    70: 'IOT-CCTV',
    100: 'SERVER',
  };

  for (let i = 1; i <= totalPorts; i++) {
    const isSfp = i > 44;
    const isDown = i % 7 === 0 || i % 11 === 0;
    const isWarning = i === 24;
    const status = isWarning ? 'warning' : isDown ? 'down' : 'up';
    const vlan = vlanPool[i % vlanPool.length];

    ports.push({
      id: i,
      name: isSfp ? `Te1/1/${i - 44}` : `Gi1/0/${i}`,
      status,
      speed: isSfp ? '10Gbps' : isDown ? 'Auto' : '1000Mbps',
      duplex: isDown ? 'Auto' : 'Full',
      vlan,
      vlanName: vlanNames[vlan],
      poeWatts: isDown || isSfp ? 0 : parseFloat((5 + Math.random() * 18).toFixed(1)),
      inTrafficMbps: isDown ? 0 : Math.floor(20 + Math.random() * 450),
      outTrafficMbps: isDown ? 0 : Math.floor(15 + Math.random() * 380),
      errorDiscards: isWarning ? 284 : isDown ? 0 : Math.floor(Math.random() * 2),
      connectedDevice: isDown ? undefined : isSfp ? 'Uplink-Trunk' : `Host-Workstation-${100 + i}`,
      connectedMac: isDown ? undefined : `00:E0:4C:${(10 + i).toString(16)}:${(20 + i).toString(16)}:${(30 + i).toString(16)}`,
      adminUp: true,
      portType: isSfp ? 'SFP+' : 'RJ45',
    });
  }
  return ports;
};

const NetworkDataContext = createContext<NetworkDataContextType | undefined>(undefined);

// Bump this suffix whenever the built-in topology dataset changes. Using a
// versioned key prevents an older browser-local snapshot from hiding updates
// made in src/data/fitmTopology.ts.
const TOPOLOGY_NODES_STORAGE_KEY = 'netmonitor_enterprise_topology_nodes_v4';
const TOPOLOGY_LINKS_STORAGE_KEY = 'netmonitor_enterprise_topology_links_v4';

export const NetworkDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<NetworkDevice[]>(() => {
    const saved = localStorage.getItem('netmonitor_devices');
    return saved ? JSON.parse(saved) : INITIAL_DEVICES;
  });

  const [vlans, setVlans] = useState<VlanInfo[]>(() => {
    const saved = localStorage.getItem('netmonitor_vlans');
    return saved ? JSON.parse(saved) : INITIAL_VLANS;
  });

  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>(() => {
    const saved = localStorage.getItem('netmonitor_aps');
    return saved ? JSON.parse(saved) : INITIAL_APS;
  });

  const [clients] = useState<ClientSession[]>(INITIAL_CLIENTS);

  const [topologyNodes, setTopologyNodes] = useState<TopologyNode[]>(() => {
    const saved = localStorage.getItem(TOPOLOGY_NODES_STORAGE_KEY);
    if (saved) {
      try {
        const stored: TopologyNode[] = JSON.parse(saved);
        if (Array.isArray(stored)) {
          // Remove the access switches if they were inserted by the reverted seed.
          if (localStorage.getItem('netmonitor_access_switch_nodes_seeded_v1')) {
            const revertedIds = new Set(['access-sw-01', 'access-sw-02', 'access-sw-03', 'access-sw-04', 'access-sw-05']);
            localStorage.removeItem('netmonitor_access_switch_nodes_seeded_v1');
            return stored.filter(node => !revertedIds.has(node.id));
          }
          return stored;
        }
      } catch (e) {}
    }
    return INITIAL_TOPOLOGY_NODES;
  });

  const [topologyLinks, setTopologyLinks] = useState<TopologyLink[]>(() => {
    const saved = localStorage.getItem(TOPOLOGY_LINKS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: TopologyLink[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validNodeIds = new Set(topologyNodes.map(node => node.id));
          if (localStorage.getItem('netmonitor_access_switch_links_seeded_v1')) {
            localStorage.removeItem('netmonitor_access_switch_links_seeded_v1');
            return parsed.filter(link => validNodeIds.has(link.source) && validNodeIds.has(link.target));
          }
          return parsed.filter(link => validNodeIds.has(link.source) && validNodeIds.has(link.target));
        }
      } catch (e) {}
    }
    return INITIAL_TOPOLOGY_LINKS;
  });

  const [alerts, setAlerts] = useState<IncidentAlert[]>(() => {
    const saved = localStorage.getItem('netmonitor_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [syslogs, setSyslogs] = useState<SyslogEntry[]>(() => {
    const saved = localStorage.getItem('netmonitor_syslogs');
    return saved ? JSON.parse(saved) : INITIAL_SYSLOGS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('netmonitor_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [backups, setBackups] = useState<ConfigBackup[]>(() => {
    const saved = localStorage.getItem('netmonitor_backups');
    return saved ? JSON.parse(saved) : INITIAL_BACKUPS;
  });

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  const [portsByDevice, setPortsByDevice] = useState<Record<string, PortInfo[]>>(() => {
    const saved = localStorage.getItem('netmonitor_ports_by_device');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }

    const initialPorts: Record<string, PortInfo[]> = {
      'dev-core-01': generateSwitchPorts(48),
      'dev-dist-01': generateSwitchPorts(48),
      'dev-dist-02': generateSwitchPorts(48),
      'dev-edge-01': generateSwitchPorts(48),
    };
    topologyNodes
      .filter(node => node.type === 'core_switch' || node.type === 'dist_switch')
      .forEach(node => {
        if (!initialPorts[node.id]) initialPorts[node.id] = generateSwitchPorts(48);
      });
    return initialPorts;
  });

  const [isTelemetrySyncing, setIsTelemetrySyncing] = useState<boolean>(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('netmonitor_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('netmonitor_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('netmonitor_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('netmonitor_backups', JSON.stringify(backups));
  }, [backups]);

  useEffect(() => {
    localStorage.setItem(TOPOLOGY_NODES_STORAGE_KEY, JSON.stringify(topologyNodes));
  }, [topologyNodes]);

  useEffect(() => {
    localStorage.setItem(TOPOLOGY_LINKS_STORAGE_KEY, JSON.stringify(topologyLinks));
  }, [topologyLinks]);

  // Keep switches from both device inventory and topology connected to their own
  // persistent port matrix. New switches are provisioned automatically.
  useEffect(() => {
    const switchNodes = topologyNodes.filter(
      node => node.type === 'core_switch' || node.type === 'dist_switch'
    );
    const switchDevices = devices.filter(device => device.type.includes('Switch'));
    setPortsByDevice(previous => {
      const missingNodes = switchNodes.filter(node => !previous[node.id]);
      const missingDevices = switchDevices.filter(device => !previous[device.id]);
      if (missingNodes.length === 0 && missingDevices.length === 0) return previous;

      const next = { ...previous };
      missingNodes.forEach(node => {
        next[node.id] = generateSwitchPorts(48);
      });
      missingDevices.forEach(device => {
        next[device.id] = generateSwitchPorts(device.portsTotal || 24);
      });
      return next;
    });
  }, [devices, topologyNodes]);

  useEffect(() => {
    localStorage.setItem('netmonitor_ports_by_device', JSON.stringify(portsByDevice));
  }, [portsByDevice]);

  const addDevice = (deviceData: Omit<NetworkDevice, 'id' | 'uptime' | 'lastSeen'>) => {
    const newDevice: NetworkDevice = {
      ...deviceData,
      id: `dev-${Date.now().toString(36)}`,
      uptime: '0d 00h 01m',
      lastSeen: 'Just now',
    };
    setDevices(prev => [newDevice, ...prev]);

    // Also init ports if switch
    if (newDevice.type.includes('Switch')) {
      setPortsByDevice(prev => ({
        ...prev,
        [newDevice.id]: generateSwitchPorts(newDevice.portsTotal || 24),
      }));
    }
  };

  const updateDevice = (id: string, updates: Partial<NetworkDevice>) => {
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const importDeviceConfig = (
    id: string,
    configText: string,
    mode: 'merge' | 'replace' = 'merge',
    enableRollback: boolean = false,
    author: string = 'Operator'
  ) => {
    const target = devices.find(d => d.id === id);
    if (!target) return { success: false, message: 'Device not found', diffAdded: 0, diffRemoved: 0 };

    const oldLines = (target.config || '').split('\n').filter(Boolean);
    const newLines = configText.split('\n').filter(Boolean);

    let finalConfig = configText;
    if (mode === 'merge' && target.config) {
      finalConfig = target.config + '\n!\n! --- Dynamically Merged Updates ---\n' + configText;
    }

    // Auto archive pre-change backup before deploying!
    const preBackup: ConfigBackup = {
      id: `bk-pre-${Date.now().toString(36)}`,
      deviceId: target.id,
      deviceName: target.name,
      deviceIp: target.ip,
      deviceType: target.type,
      versionTag: `Pre-Deploy (${new Date().toLocaleTimeString('en-US', { hour12: false })})`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      sizeKb: parseFloat(((target.config || '').length / 1024).toFixed(1)) || 10.0,
      checksumSha256: generateMockSha256((target.config || '') + target.id + Date.now()),
      triggeredBy: author,
      triggerType: 'pre-change',
      configContent: target.config || '! Baseline Config',
      format: target.type === 'Firewall' ? 'fortios' : 'cisco_ios',
      notes: `Pre-deployment automated snapshot before ${mode.toUpperCase()} operation`,
    };
    setBackups(prev => [preBackup, ...prev]);

    setDevices(prev =>
      prev.map(d => {
        if (d.id === id) {
          return { ...d, config: finalConfig, lastSeen: 'Just now' };
        }
        return d;
      })
    );

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newLog: SyslogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      facility: 'SYSTEM',
      severity: 'Notice',
      host: target.name,
      ip: target.ip,
      tag: '%SYS-5-CONFIG_I',
      message: `Configured from NetMonitor console by ${author} (Strategy: ${mode.toUpperCase()}${enableRollback ? ', Watchdog Rollback: 300s' : ''})`,
    };
    setSyslogs(prev => [newLog, ...prev]);

    return {
      success: true,
      message: `Config successfully deployed to ${target.name} [${target.ip}]`,
      diffAdded: newLines.length,
      diffRemoved: mode === 'replace' ? oldLines.length : 0,
    };
  };

  const createBackup = (
    deviceId: string,
    versionTag: string,
    triggerType: 'manual' | 'scheduled' | 'pre-change',
    author: string,
    notes?: string
  ): ConfigBackup => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) throw new Error('Device not found');

    const content = dev.config || `! Auto-Generated running-config for ${dev.name}\nhostname ${dev.name}\n!\nend`;
    const format = dev.type === 'Firewall' ? 'fortios' : dev.vendor === 'Aruba Networks' ? 'generic' : 'cisco_ios';

    const newBackup: ConfigBackup = {
      id: `bk-${Date.now().toString(36)}`,
      deviceId: dev.id,
      deviceName: dev.name,
      deviceIp: dev.ip,
      deviceType: dev.type,
      versionTag,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      sizeKb: parseFloat((content.length / 1024).toFixed(1)) || 12.4,
      checksumSha256: generateMockSha256(content + Date.now()),
      triggeredBy: author,
      triggerType,
      configContent: content,
      format,
      notes: notes || `Snapshot archived by ${author}`,
    };

    setBackups(prev => [newBackup, ...prev]);

    // Add syslog entry
    const newLog: SyslogEntry = {
      id: `log-${Date.now()}`,
      timestamp: newBackup.timestamp,
      facility: 'SYSTEM',
      severity: 'Info',
      host: dev.name,
      ip: dev.ip,
      tag: '%CFG-6-BACKUP_ARCHIVED',
      message: `Configuration backup [${versionTag}] created by ${author} (SHA-256: ${newBackup.checksumSha256.slice(0, 12)}...)`,
    };
    setSyslogs(prev => [newLog, ...prev]);

    return newBackup;
  };

  const deleteBackup = (backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
  };

  const restoreBackup = (backupId: string, author: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    // Apply config to device
    setDevices(prev =>
      prev.map(d => (d.id === backup.deviceId ? { ...d, config: backup.configContent } : d))
    );

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newLog: SyslogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      facility: 'SYSTEM',
      severity: 'Notice',
      host: backup.deviceName,
      ip: backup.deviceIp,
      tag: '%CFG-5-RESTORE_COMMITTED',
      message: `Configuration rolled back to [${backup.versionTag}] by ${author} via Automated Backup Manager`,
    };
    setSyslogs(prev => [newLog, ...prev]);
  };

  const runGlobalBackup = async (
    author: string,
    onProgress?: (percent: number, currentDevice: string) => void
  ) => {
    setIsBackingUp(true);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const createdList: ConfigBackup[] = [];

    for (let i = 0; i < devices.length; i++) {
      const dev = devices[i];
      if (onProgress) {
        const percent = Math.round(((i + 1) / devices.length) * 100);
        onProgress(percent, dev.name);
      }
      await new Promise(r => setTimeout(r, 450));

      const content = dev.config || `! Auto-Generated running-config for ${dev.name}\nhostname ${dev.name}\n!\nend`;
      const format = dev.type === 'Firewall' ? 'fortios' : 'cisco_ios';

      const backup: ConfigBackup = {
        id: `bk-${Date.now().toString(36)}-${i}`,
        deviceId: dev.id,
        deviceName: dev.name,
        deviceIp: dev.ip,
        deviceType: dev.type,
        versionTag: `vAuto-${now.slice(0, 10).replace(/-/g, '')}-${now.slice(11, 16).replace(':', '')}`,
        timestamp: now,
        sizeKb: parseFloat((content.length / 1024).toFixed(1)) || 14.2,
        checksumSha256: generateMockSha256(content + dev.id + Date.now()),
        triggeredBy: author,
        triggerType: 'scheduled',
        configContent: content,
        format,
        notes: `Global backup run triggered by ${author}`,
      };
      createdList.push(backup);
    }

    setBackups(prev => [...createdList, ...prev]);
    setSettings(prev => ({
      ...prev,
      backupPolicy: {
        ...prev.backupPolicy,
        lastGlobalBackup: now,
      },
    }));

    const newLog: SyslogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      facility: 'SYSTEM',
      severity: 'Notice',
      host: 'NetMonitor-Core',
      ip: '10.10.0.1',
      tag: '%CFG-5-GLOBAL_BACKUP_COMPLETE',
      message: `Global backup snapshot completed for all ${devices.length} network hardware nodes by ${author}`,
    };
    setSyslogs(prev => [newLog, ...prev]);
    setIsBackingUp(false);
  };

  const togglePortState = (deviceId: string, portId: number) => {
    setPortsByDevice(prev => {
      const list = prev[deviceId];
      if (!list) return prev;
      const updated = list.map(p => {
        if (p.id === portId) {
          const nextAdmin = !p.adminUp;
          return {
            ...p,
            adminUp: nextAdmin,
            status: (nextAdmin ? 'up' : 'down') as 'up' | 'down',
          };
        }
        return p;
      });
      return { ...prev, [deviceId]: updated };
    });
  };

  const addVlan = (vlanData: Omit<VlanInfo, 'activePorts' | 'trafficRateMbps'>) => {
    const newVlan: VlanInfo = {
      ...vlanData,
      activePorts: 0,
      trafficRateMbps: 0,
    };
    setVlans(prev => [...prev, newVlan]);
  };

  const rebootAccessPoint = async (apId: string) => {
    setAccessPoints(prev =>
      prev.map(ap => (ap.id === apId ? { ...ap, status: 'warning', uptime: 'Rebooting...' } : ap))
    );

    // Simulate reboot delay
    await new Promise(res => setTimeout(res, 2000));

    setAccessPoints(prev =>
      prev.map(ap => (ap.id === apId ? { ...ap, status: 'online', uptime: '0d 00h 01m' } : ap))
    );
  };

  const updateTopologyNodePosition = (id: string, x: number, y: number) => {
    setTopologyNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, x, y } : n))
    );
  };

  const updateTopologyNode: NetworkDataContextType['updateTopologyNode'] = (id, updates) => {
    setTopologyNodes(prev => prev.map(node => node.id === id ? { ...node, ...updates } : node));
  };

  const updateTopologyLink: NetworkDataContextType['updateTopologyLink'] = (id, updates) => {
    setTopologyLinks(prev => prev.map(link => link.id === id ? { ...link, ...updates } : link));
  };

  const deleteTopologyLink = (id: string) => {
    setTopologyLinks(prev => prev.filter(link => link.id !== id));
  };

  const addTopologyNode = (nodeData: Omit<TopologyNode, 'id'>) => {
    const newNode: TopologyNode = {
      ...nodeData,
      id: `node-${Date.now().toString(36)}`,
    };
    const updated = arrangeTopologyLayers([...topologyNodes, newNode]);
    setTopologyNodes(updated);
    localStorage.setItem(TOPOLOGY_NODES_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteTopologyNode = (id: string) => {
    const updatedNodes = arrangeTopologyLayers(topologyNodes.filter(n => n.id !== id));
    const updatedLinks = topologyLinks.filter(l => l.source !== id && l.target !== id);
    setTopologyNodes(updatedNodes);
    setTopologyLinks(updatedLinks);
    localStorage.setItem(TOPOLOGY_NODES_STORAGE_KEY, JSON.stringify(updatedNodes));
    localStorage.setItem(TOPOLOGY_LINKS_STORAGE_KEY, JSON.stringify(updatedLinks));
  };

  const toggleSubtreeCollapse = (nodeId: string) => {
    setTopologyNodes(prev =>
      arrangeTopologyLayers(prev.map(n => (n.id === nodeId ? { ...n, isCollapsed: !n.isCollapsed } : n)))
    );
  };

  const connectTopologyLink = (source: string, target: string, linkType: 'fiber_10g' | 'copper_1g' | 'fiber_40g' | 'trunk') => {
    const exists = topologyLinks.some(
      l => (l.source === source && l.target === target) || (l.source === target && l.target === source)
    );
    if (exists) {
      alert('มีการเชื่อมต่อเครือข่ายระหว่างสองโหนดนี้อยู่แล้ว');
      return;
    }

    const speedMap = {
      fiber_10g: '10 Gbps SFP+',
      copper_1g: '1 Gbps Cat6',
      fiber_40g: '40 Gbps QSFP+',
      trunk: 'VLAN 802.1Q Trunk',
    };
    const newLink: TopologyLink = {
      id: `link-${Date.now().toString(36)}`,
      source,
      target,
      speed: speedMap[linkType],
      linkType,
      status: 'up',
    };
    const updatedLinks = [...topologyLinks, newLink];
    setTopologyLinks(updatedLinks);
    localStorage.setItem(TOPOLOGY_LINKS_STORAGE_KEY, JSON.stringify(updatedLinks));
  };

  const saveTopologyLayout = () => {
    localStorage.setItem(TOPOLOGY_NODES_STORAGE_KEY, JSON.stringify(topologyNodes));
    localStorage.setItem(TOPOLOGY_LINKS_STORAGE_KEY, JSON.stringify(topologyLinks));
  };

  const acknowledgeAlert = (alertId: string, noteText: string, author: string, role: Role) => {
    const trimmedNote = noteText ? noteText.trim() : '';
    if (!trimmedNote) {
      console.warn('Rejected acknowledgeAlert: noteText is required');
      return;
    }

    const newNote = {
      id: `note-${Date.now()}`,
      author,
      role,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      text: trimmedNote,
    };

    setAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          return {
            ...a,
            status: 'acknowledged',
            acknowledgedBy: author,
            acknowledgedAt: newNote.timestamp,
            notes: [...a.notes, newNote],
          };
        }
        return a;
      })
    );

    // Also inject into syslogs
    const newLog: SyslogEntry = {
      id: `log-${Date.now()}`,
      timestamp: newNote.timestamp,
      facility: 'SYSTEM',
      severity: 'Notice',
      host: 'NetMonitor-Core',
      ip: '10.10.0.1',
      tag: '%ALARM-5-ACK',
      message: `Alert ${alertId} acknowledged by ${author} (${role}): "${trimmedNote}"`,
    };
    setSyslogs(prev => [newLog, ...prev]);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'resolved' } : a))
    );
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const refreshTelemetry = () => {
    setIsTelemetrySyncing(true);
    setTimeout(() => {
      // Slightly fluctuate metrics for realistic dynamic NOC feel
      setDevices(prev =>
        prev.map(d => ({
          ...d,
          cpu: Math.min(99, Math.max(8, d.cpu + Math.floor((Math.random() - 0.45) * 6))),
          ram: Math.min(95, Math.max(20, d.ram + Math.floor((Math.random() - 0.48) * 4))),
          pingMs: parseFloat((d.pingMs + (Math.random() - 0.5) * 0.3).toFixed(1)),
        }))
      );
      setIsTelemetrySyncing(false);
    }, 600);
  };

  return (
    <NetworkDataContext.Provider
      value={{
        devices,
        portsByDevice,
        vlans,
        accessPoints,
        clients,
        topologyNodes,
        topologyLinks,
        alerts,
        syslogs,
        settings,
        backups,
        isBackingUp,
        addDevice,
        updateDevice,
        deleteDevice,
        importDeviceConfig,
        createBackup,
        deleteBackup,
        restoreBackup,
        runGlobalBackup,
        togglePortState,
        addVlan,
        rebootAccessPoint,
        updateTopologyNodePosition,
        updateTopologyNode,
        updateTopologyLink,
        deleteTopologyLink,
        addTopologyNode,
        deleteTopologyNode,
        toggleSubtreeCollapse,
        connectTopologyLink,
        saveTopologyLayout,
        acknowledgeAlert,
        resolveAlert,
        updateSettings,
        refreshTelemetry,
        isTelemetrySyncing,
      }}
    >
      {children}
    </NetworkDataContext.Provider>
  );
};

export const useNetworkData = (): NetworkDataContextType => {
  const context = useContext(NetworkDataContext);
  if (!context) {
    throw new Error('useNetworkData must be used within a NetworkDataProvider');
  }
  return context;
};

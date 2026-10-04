export type Role = 'Admin' | 'Engineer' | 'Viewer';

export interface UserPermissions {
  canEditDevices: boolean;
  canManageUsers: boolean;
  canEditTopology: boolean;
  canImportConfig: boolean;
  canAcknowledgeAlerts: boolean;
  canModifySettings: boolean;
  canRebootDevices: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  avatar?: string;
  department: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLogin: string;
  permissions: UserPermissions;
}

export type DeviceType = 
  | 'Router' 
  | 'Core Switch' 
  | 'Distribution Switch' 
  | 'Edge Switch' 
  | 'Firewall' 
  | 'Server';

export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: DeviceType;
  vendor: string;
  model: string;
  location: string;
  rack: string;
  status: 'online' | 'warning' | 'offline';
  uptime: string;
  cpu: number;
  ram: number;
  temp: number;
  portsTotal: number;
  portsUp: number;
  pingMs: number;
  lastSeen: string;
  firmware: string;
  config?: string;
  snmpCommunity: string;
}

export interface PortInfo {
  id: number;
  name: string;
  status: 'up' | 'down' | 'warning';
  speed: string;
  duplex: 'Full' | 'Half' | 'Auto';
  vlan: number;
  vlanName: string;
  poeWatts: number;
  inTrafficMbps: number;
  outTrafficMbps: number;
  errorDiscards: number;
  connectedDevice?: string;
  connectedMac?: string;
  adminUp: boolean;
  portType: 'RJ45' | 'SFP+' | 'QSFP';
}

export interface VlanInfo {
  id: number;
  name: string;
  subnet: string;
  gateway: string;
  activePorts: number;
  dhcpTotal: number;
  dhcpUsed: number;
  trafficRateMbps: number;
  status: 'active' | 'degraded';
  description: string;
}

export interface AccessPoint {
  id: string;
  name: string;
  ip: string;
  mac: string;
  location: string;
  building: string;
  floor: string;
  ssidList: string[];
  channels: {
    band24: number;
    band5: number;
    band6?: number;
  };
  txPowerDbm: number;
  channelWidthMhz: number;
  rssiAvg: number;
  connectedClients: number;
  cpu: number;
  ram: number;
  retryRate: number;
  status: 'online' | 'warning' | 'offline';
  model: string;
  uptime: string;
}

export interface ClientSession {
  id: string;
  hostname: string;
  ip: string;
  mac: string;
  connectedNode: string;
  nodeType: 'AP' | 'Switch';
  vlanId: number;
  ssid?: string;
  band?: '2.4 GHz' | '5 GHz' | '6 GHz' | 'Ethernet';
  rssi: number;
  rxRateMbps: number;
  txRateMbps: number;
  duration: string;
  osVendor: string;
  osType: 'Apple' | 'Android' | 'Windows' | 'Linux' | 'IoT';
  status: 'active' | 'idle';
}

export interface TopologyNode {
  id: string;
  label: string;
  ip: string;
  tier: 1 | 2 | 3 | 4 | 5;
  type: 'wan' | 'firewall' | 'core_switch' | 'dist_switch' | 'edge_ap' | 'host_group' | 'server';
  status: 'online' | 'warning' | 'offline';
  x: number;
  y: number;
  groupCount?: number;
  isCollapsed?: boolean;
  subClients?: string[];
  model?: string;
  referenceOnly?: boolean;
  location?: string;
  notes?: string[];
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  speed: string;
  linkType: 'fiber_10g' | 'copper_1g' | 'fiber_40g' | 'trunk';
  status: 'up' | 'degraded' | 'down';
  referenceOnly?: boolean;
  notes?: string;
  route?: 'outer-left';
}

export interface AlertNote {
  id: string;
  author: string;
  role: Role;
  timestamp: string;
  text: string;
}

export interface IncidentAlert {
  id: string;
  timestamp: string;
  deviceName: string;
  deviceIp: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes: AlertNote[];
}

export interface SyslogEntry {
  id: string;
  timestamp: string;
  facility: string;
  severity: 'Emergency' | 'Alert' | 'Critical' | 'Error' | 'Warning' | 'Notice' | 'Info';
  host: string;
  ip: string;
  tag: string;
  message: string;
}

export interface ConfigBackup {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceIp: string;
  deviceType: DeviceType;
  versionTag: string;
  timestamp: string;
  sizeKb: number;
  checksumSha256: string;
  triggeredBy: string;
  triggerType: 'scheduled' | 'manual' | 'pre-change';
  configContent: string;
  format: 'cisco_ios' | 'fortios' | 'json' | 'generic';
  notes?: string;
}

export interface BackupPolicy {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'hourly' | 'on_change';
  scheduledTime: string;
  scheduledDay?: string;
  protocol: 'SCP' | 'SFTP' | 'TFTP' | 'HTTPS';
  serverIp: string;
  serverPort: number;
  storagePath: string;
  username: string;
  retentionRevisions: number;
  enableEncryption: boolean;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  autoPurgeOld: boolean;
  lastGlobalBackup?: string;
}

export interface SystemSettings {
  orgName: string;
  gatewayIp: string;
  timezone: string;
  snmpInterval: number;
  pingTimeoutMs: number;
  packetLossThreshold: number;
  slackWebhook: string;
  telegramBotToken: string;
  telegramChatId: string;
  emailNotification: string;
  sessionTimeoutMinutes: number;
  require2FA: boolean;
  autoBackupConfig: boolean;
  backupPolicy: BackupPolicy;
}

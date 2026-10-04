import type { TopologyLink, TopologyNode } from '../types';

// Default enterprise topology shown on the NOC canvas. Positions mirror the
// supplied reference: a centered upstream chain fanning out from the core.
export const FITM_NODES: TopologyNode[] = [
  { id: 'internet-isp', label: 'Internet / ISP Dual-Homed', ip: '203.158.0.1', type: 'wan', tier: 1, status: 'online', x: 670, y: 50, model: 'Dual ISP Transit', location: 'External WAN' },
  { id: 'perimeter-ngfw', label: 'Perimeter NGFW Cluster', ip: '192.168.100.2', type: 'firewall', tier: 2, status: 'online', x: 670, y: 190, model: 'FortiGate 200F HA', location: 'Security Perimeter' },
  { id: 'core-l3-sw', label: 'Core-L3-SW-01', ip: '10.10.0.1', type: 'core_switch', tier: 3, status: 'online', x: 670, y: 350, model: 'Catalyst 9500', location: 'Core Network' },
  { id: 'dist-sw-east', label: 'Dist-SW-EastWing', ip: '10.10.0.2', type: 'dist_switch', tier: 4, status: 'online', x: 180, y: 555, model: 'Catalyst 9300', location: 'East Wing' },
  { id: 'device-kod-hod', label: 'กดหด', ip: 'หดหด', type: 'dist_switch', tier: 4, status: 'online', x: 180, y: 700, location: 'East Wing' },
  { id: 'dist-sw-west', label: 'Dist-SW-WestWing', ip: '10.10.0.3', type: 'dist_switch', tier: 4, status: 'warning', x: 670, y: 555, model: 'Catalyst 9300', location: 'West Wing' },
  { id: 'core-server-farm', label: 'Core Server Farm', ip: '10.10.100.10', type: 'server', tier: 4, status: 'online', x: 1160, y: 555, model: 'Virtualization Cluster', location: 'Data Center' },
];

export const FITM_LINKS: TopologyLink[] = [
  { id: 'link-isp-ngfw', source: 'internet-isp', target: 'perimeter-ngfw', speed: '40 Gbps', linkType: 'fiber_40g', status: 'up' },
  { id: 'link-ngfw-core', source: 'perimeter-ngfw', target: 'core-l3-sw', speed: '40 Gbps Trunk', linkType: 'fiber_40g', status: 'up' },
  { id: 'link-core-east', source: 'core-l3-sw', target: 'dist-sw-east', speed: '10 Gbps LACP', linkType: 'fiber_10g', status: 'up' },
  { id: 'link-east-kod-hod', source: 'dist-sw-east', target: 'device-kod-hod', speed: '10 Gbps SFP+', linkType: 'fiber_10g', status: 'up' },
  { id: 'link-core-west', source: 'core-l3-sw', target: 'dist-sw-west', speed: '10 Gbps LACP', linkType: 'fiber_10g', status: 'degraded' },
  { id: 'link-core-server', source: 'core-l3-sw', target: 'core-server-farm', speed: '40 Gbps DAC', linkType: 'fiber_40g', status: 'up' },
];

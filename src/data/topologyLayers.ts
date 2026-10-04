import type { TopologyNode } from '../types';

export const TOPOLOGY_LAYERS = [
  { tier: 1, title: 'WAN TRANSIT', description: 'Internet and upstream transit', color: '#60a5fa', type: 'wan' },
  { tier: 2, title: 'SECURITY CLUSTER', description: 'Perimeter firewall and security services', color: '#34d399', type: 'firewall' },
  { tier: 3, title: 'CORE NETWORK', description: 'Layer 3 core switching', color: '#22d3ee', type: 'core_switch' },
  { tier: 4, title: 'DISTRIBUTION & SERVER BACKBONE', description: 'Distribution switching and server farm', color: '#c084fc', type: 'dist_switch' },
] as const;

export function getTopologyTier(node: Pick<TopologyNode, 'type' | 'tier'>): 1 | 2 | 3 | 4 {
  if (node.tier >= 1 && node.tier <= 4) return node.tier as 1 | 2 | 3 | 4;
  if (node.type === 'wan') return 1;
  if (node.type === 'firewall') return 2;
  if (node.type === 'core_switch') return 3;
  return 4;
}

export function getTopologyLayers(nodes: TopologyNode[]) {
  let top = 36;
  return TOPOLOGY_LAYERS.map(layer => {
    const members = nodes.filter(node => getTopologyTier(node) === layer.tier);
    const rowHeight = Math.max(140, ...members.map(node =>
      140 + (node.type === 'host_group' && !node.isCollapsed ? (node.subClients?.length ?? 0) * 20 : 0)
    ));
    // Grow each band with its contents. This keeps large topologies usable
    // instead of allowing rows to overlap the tier below them.
    const rows = Math.max(1, Math.ceil(members.length / 4));
    const height = Math.max(layer.tier === 4 ? 230 : 150, 82 + rows * rowHeight);
    const band = { ...layer, top, height, rowHeight, count: members.length };
    top += height;
    return band;
  });
}

export function arrangeTopologyLayers(nodes: TopologyNode[]): TopologyNode[] {
  const bands = getTopologyLayers(nodes);
  const counts = new Map<number, number>();
  return nodes.map(node => {
    const tier = getTopologyTier(node);
    const band = bands[tier - 1];
    const index = counts.get(tier) ?? 0;
    counts.set(tier, index + 1);
    const columns = Math.min(4, band.count);
    return { ...node, tier, x: 270 + (4 - columns) * 145 + (index % 4) * 290,
      y: band.top + 45 + Math.floor(index / 4) * band.rowHeight };
  });
}

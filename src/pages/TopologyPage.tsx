import { getTopologyLayers, getTopologyTier, TOPOLOGY_LAYERS } from '../data/topologyLayers';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNetworkData } from '../context/NetworkDataContext';
import { useAuth } from '../context/AuthContext';
import {
  GitFork,
  Cloud,
  Shield,
  Server,
  Layers,
  Wifi,
  Users,
  Plus,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Search,
  Move,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { TopologyNode, TopologyLink } from '../types';
import { TopologyEditor } from '../components/TopologyEditor';

export const TopologyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const {
    topologyNodes,
    topologyLinks,
    updateTopologyNodePosition,
    addTopologyNode,
    deleteTopologyNode,
    toggleSubtreeCollapse,
    connectTopologyLink,
    saveTopologyLayout,
    deleteTopologyLink,
  } = useNetworkData();
  const { isAdmin, isEngineer, isViewer } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = topologyNodes.find(node => node.id === selectedNodeId) ?? null;
  const setSelectedNode = (node: TopologyNode | null) => setSelectedNodeId(node?.id ?? null);
  const [editingNode, setEditingNode] = useState<TopologyNode | null>(null);
  const [editingLink, setEditingLink] = useState<TopologyLink | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Dragging state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceId: string;
    x: number;
    y: number;
    hoverTargetId: string | null;
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const dragFrameRef = useRef<number | null>(null);
  const [canvasExtent, setCanvasExtent] = useState({ width: 1520, height: 0 });
  const layers = getTopologyLayers(topologyNodes);
  const nodeWidth = 180;
  const nodeHeight = 56;
  const canvasWidth = Math.max(canvasExtent.width, 1520, ...topologyNodes.map(node => node.x + nodeWidth + 240));
  const canvasHeight = Math.max(canvasExtent.height, layers[layers.length - 1].top + layers[layers.length - 1].height + 120, ...topologyNodes.map(node =>
    node.y + 140 + (node.type === 'host_group' && !node.isCollapsed ? (node.subClients?.length ?? 0) * 20 : 0)
  ));

  // Keep adding space as the viewport reaches an edge. The DOM still renders a
  // finite surface at any instant, while the user can continue scrolling for as
  // long as needed without paying the cost of one enormous canvas up front.
  const growCanvasTo = (requiredWidth: number, requiredHeight: number) => {
    const widthChunk = 960;
    const heightChunk = 640;
    setCanvasExtent(previous => ({
      width: requiredWidth > previous.width
        ? Math.ceil(requiredWidth / widthChunk) * widthChunk
        : previous.width,
      height: requiredHeight > previous.height
        ? Math.ceil(requiredHeight / heightChunk) * heightChunk
        : previous.height,
    }));
  };

  const handleViewportScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    const threshold = 240;
    const nearRightEdge = viewport.scrollWidth - viewport.scrollLeft - viewport.clientWidth < threshold;
    const nearBottomEdge = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold;

    if (nearRightEdge || nearBottomEdge) {
      growCanvasTo(
        nearRightEdge ? canvasWidth + 960 : canvasWidth,
        nearBottomEdge ? canvasHeight + 640 : canvasHeight,
      );
    }
  };

  const fitView = () => {
    if (!viewportRef.current) return;
    setZoomLevel(Math.min(1, (viewportRef.current.clientWidth - 24) / canvasWidth, (viewportRef.current.clientHeight - 24) / canvasHeight));
    viewportRef.current.scrollTo(0, 0);
  };

  const zoomTo = (requestedZoom: number, anchor?: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    const nextZoom = Math.max(0.2, Math.min(2, requestedZoom));
    if (!viewport || nextZoom === zoomLevel) return;

    const point = anchor ?? { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
    const worldX = (viewport.scrollLeft + point.x) / zoomLevel;
    const worldY = (viewport.scrollTop + point.y) / zoomLevel;

    setZoomLevel(nextZoom);
    requestAnimationFrame(() => {
      viewport.scrollTo({
        left: worldX * nextZoom - point.x,
        top: worldY * nextZoom - point.y,
        behavior: 'auto',
      });
    });
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const direction = event.deltaY < 0 ? 1 : -1;
    zoomTo(zoomLevel + direction * 0.1, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
  useEffect(() => {
    fitView();
  }, []);

  // Link Connect Form State
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [linkType, setLinkType] = useState<'fiber_10g' | 'copper_1g' | 'fiber_40g' | 'trunk'>('fiber_10g');

  // Add Node Form State
  const [newNode, setNewNode] = useState({
    label: '',
    ip: '',
    tier: 3 as 1 | 2 | 3 | 4 | 5,
    type: 'dist_switch' as TopologyNode['type'],
    status: 'online' as 'online' | 'warning' | 'offline',
    x: 500,
    y: 430,
    model: 'Catalyst 9300',
  });

  const canEdit = !isViewer && (isAdmin || isEngineer);

  useEffect(() => {
    if (!connectionDrag) return;

    const handleConnectionMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      const viewport = viewportRef.current;
      if (!canvas || !viewport) return;

      const viewportRect = viewport.getBoundingClientRect();
      const edge = 72;
      const speed = (distance: number) => Math.ceil((edge - Math.max(0, distance)) / 5);
      let scrollX = 0;
      let scrollY = 0;
      if (event.clientX - viewportRect.left < edge) scrollX = -speed(event.clientX - viewportRect.left);
      else if (viewportRect.right - event.clientX < edge) scrollX = speed(viewportRect.right - event.clientX);
      if (event.clientY - viewportRect.top < edge) scrollY = -speed(event.clientY - viewportRect.top);
      else if (viewportRect.bottom - event.clientY < edge) scrollY = speed(viewportRect.bottom - event.clientY);
      if (scrollX || scrollY) viewport.scrollBy(scrollX, scrollY);

      const rect = canvas.getBoundingClientRect();
      setConnectionDrag(current => current ? {
        ...current,
        x: (event.clientX - rect.left) / zoomLevel,
        y: (event.clientY - rect.top) / zoomLevel,
      } : null);
    };

    const cancelConnection = () => setConnectionDrag(null);
    window.addEventListener('mousemove', handleConnectionMove);
    window.addEventListener('mouseup', cancelConnection);
    return () => {
      window.removeEventListener('mousemove', handleConnectionMove);
      window.removeEventListener('mouseup', cancelConnection);
    };
  }, [connectionDrag?.sourceId, zoomLevel]);

  const startConnectionDrag = (event: React.MouseEvent, node: TopologyNode) => {
    event.preventDefault();
    event.stopPropagation();
    setConnectionDrag({
      sourceId: node.id,
      x: node.x + nodeWidth,
      y: node.y + nodeHeight / 2,
      hoverTargetId: null,
    });
  };

  const finishConnectionDrag = (event: React.MouseEvent, target: TopologyNode) => {
    if (!connectionDrag || connectionDrag.sourceId === target.id) return;
    event.preventDefault();
    event.stopPropagation();
    connectTopologyLink(connectionDrag.sourceId, target.id, linkType);
    setConnectionDrag(null);
  };

  // Window-level mouse listeners while dragging to prevent cursor sticking / leaks
  useEffect(() => {
    if (!draggedNodeId) return;

    const moveDraggedNode = () => {
      const viewport = viewportRef.current;
      if (!canvasRef.current || !viewport) return;

      const edge = 72;
      const viewportRect = viewport.getBoundingClientRect();
      const pointer = pointerRef.current;
      const leftDistance = pointer.x - viewportRect.left;
      const rightDistance = viewportRect.right - pointer.x;
      const topDistance = pointer.y - viewportRect.top;
      const bottomDistance = viewportRect.bottom - pointer.y;
      const speed = (distance: number) => Math.ceil((edge - Math.max(0, distance)) / 5);

      let scrollX = 0;
      let scrollY = 0;
      if (leftDistance < edge) scrollX = -speed(leftDistance);
      else if (rightDistance < edge) scrollX = speed(rightDistance);
      if (topDistance < edge) scrollY = -speed(topDistance);
      else if (bottomDistance < edge) scrollY = speed(bottomDistance);

      if (scrollX || scrollY) viewport.scrollBy(scrollX, scrollY);

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (pointer.x - rect.left) / zoomLevel;
      const mouseY = (pointer.y - rect.top) / zoomLevel;

      // Nodes may be placed anywhere on the working surface. Their tier still
      // controls metadata and the guide label, but must not lock vertical drag.
      const newX = Math.max(40, Math.round(mouseX - dragOffset.x));
      const newY = Math.max(40, Math.round(mouseY - dragOffset.y));
      const draggedNode = topologyNodes.find(node => node.id === draggedNodeId);
      if (!draggedNode) return;
      growCanvasTo(newX + nodeWidth + 320, newY + nodeHeight + 240);
      updateTopologyNodePosition(draggedNodeId, newX, newY);

      dragFrameRef.current = requestAnimationFrame(moveDraggedNode);
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleWindowMouseUp = () => {
      setDraggedNodeId(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    dragFrameRef.current = requestAnimationFrame(moveDraggedNode);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    };
  }, [draggedNodeId, dragOffset, zoomLevel]);

  // Handle Drag Start
  const handleMouseDown = (e: React.MouseEvent, node: TopologyNode) => {
    if (!canEdit || !editMode) {
      setSelectedNode(node);
      if (node.type === 'core_switch' || node.type === 'dist_switch') {
        // Topology nodes and inventory devices can use different IDs for the
        // same physical switch. Send the IP as a stable cross-page identity.
        navigate(`/ports?device=${encodeURIComponent(node.id)}&ip=${encodeURIComponent(node.ip)}`);
      }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    pointerRef.current = { x: e.clientX, y: e.clientY };
    setDraggedNodeId(node.id);
    setSelectedNode(node);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomLevel;
      const mouseY = (e.clientY - rect.top) / zoomLevel;
      setDragOffset({
        x: mouseX - node.x,
        y: mouseY - node.y,
      });
    }
  };

  const handleSave = () => {
    saveTopologyLayout();
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleConnectLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) {
      alert('กรุณาเลือกโหนดสองโหนดที่แตกต่างกันเพื่อเชื่อมต่อ');
      return;
    }
    connectTopologyLink(sourceNodeId, targetNodeId, linkType);
    setShowConnectModal(false);
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    addTopologyNode(newNode);
    setShowAddModal(false);
    setNewNode({
      label: '',
      ip: '',
      tier: 3,
      type: 'dist_switch',
      status: 'online',
      x: 500,
      y: 430,
      model: 'Catalyst 9300',
    });
  };

  const getNodeIcon = (type: TopologyNode['type']) => {
    switch (type) {
      case 'wan':
        return <Cloud className="w-5 h-5 text-blue-400" />;
      case 'firewall':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'core_switch':
        return <Server className="w-5 h-5 text-cyan-400" />;
      case 'dist_switch':
        return <Layers className="w-5 h-5 text-purple-400" />;
      case 'edge_ap':
        return <Wifi className="w-5 h-5 text-amber-400" />;
      case 'host_group':
        return <Users className="w-5 h-5 text-slate-500" />;
      case 'server':
        return <Server className="w-5 h-5 text-rose-400" />;
      default:
        return <Server className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getNodeBorder = (node: TopologyNode) => {
    const isSearched =
      searchQuery &&
      (node.label.toLowerCase().includes(searchQuery.toLowerCase()) || node.ip.includes(searchQuery));
    if (isSearched) return 'border-cyan-300 ring-2 ring-cyan-400/40 shadow-[0_0_28px_rgba(34,211,238,.2)]';
    if (selectedNode?.id === node.id) return 'border-cyan-400 ring-1 ring-cyan-400/40 shadow-[0_0_24px_rgba(6,182,212,.16)]';
    if (node.status === 'warning') return 'border-amber-500 shadow-[0_0_22px_rgba(245,158,11,.12)]';
    if (node.status === 'offline') return 'border-rose-500 shadow-[0_0_22px_rgba(244,63,94,.12)]';
    return 'border-slate-300 hover:border-cyan-500';
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GitFork className="w-6 h-6 text-cyan-500" />
            NETWORK FITM
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Node Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchNode')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5">
            <button
              onClick={() => zoomTo(zoomLevel + 0.1)}
              title={t('zoomIn')}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-500">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => zoomTo(zoomLevel - 0.1)}
              title={t('zoomOut')}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => zoomTo(1)}
              title={t('resetView')}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-white border-l border-slate-200 dark:border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button onClick={fitView} title="แสดงผังทั้งหมด" className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-cyan-600"><Maximize className="w-4 h-4" /></button>
          {/* Edit Mode Toggle (Admin & Engineer Only) */}
          {canEdit && (
            <>
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  setConnectionDrag(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  editMode
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>{editMode ? t('exitEditMode') : t('editMode')}</span>
              </button>

              {editMode && (
                <>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addNode')}</span>
                  </button>

                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{t('connectCable')}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('saveLayout')}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Save Layout Success Banner */}
      {saveSuccessNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{t('layoutSaved')}</span>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div
        ref={viewportRef}
        onWheel={handleCanvasWheel}
        onScroll={handleViewportScroll}
        className="topology-viewport rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/70 overflow-auto relative h-[min(78vh,900px)] min-h-[520px] select-none"
        tabIndex={0}
        role="region"
        aria-label={t('interactiveTopology')}
      >
        {/* Reserve the scaled dimensions so both scrollbars follow the zoom level. */}
        <div style={{ width: canvasWidth * zoomLevel, height: canvasHeight * zoomLevel }} className="relative overflow-visible">
        <div
          ref={canvasRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            width: canvasWidth,
            height: canvasHeight,
          }}
          className="relative"
        >
        {layers.map(layer => (
          <div key={layer.tier} className="absolute border-t border-dashed pointer-events-none"
            style={{ left: 20, top: layer.top, width: canvasWidth - 40, height: layer.height,
              borderColor: '#cbd5e1' }}>
            <div className="absolute left-2 -top-5 text-[9px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-400">
              {layer.title}
            </div>
          </div>
        ))}

          {/* Render SVG Topology Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {topologyLinks.map(link => {
              const sourceNode = topologyNodes.find(n => n.id === link.source);
              const targetNode = topologyNodes.find(n => n.id === link.target);
              if (!sourceNode || !targetNode) return null;

              const isDegraded = link.status === 'degraded';
              const strokeColor = isDegraded
                ? '#f59e0b'
                : link.linkType === 'copper_1g'
                ? '#3b82f6'
                : '#06a6c7';

              const siblings = topologyLinks.filter(l => l.source === link.source && l.target === link.target);
              const offset = (siblings.indexOf(link) - (siblings.length - 1) / 2) * 26;
              const sameRow = sourceNode.y === targetNode.y;
              const downward = targetNode.y > sourceNode.y;
              const x1 = sourceNode.x + nodeWidth / 2 + offset, y1 = sourceNode.y + (sameRow ? 0 : downward ? nodeHeight : 0);
              const x2 = targetNode.x + nodeWidth / 2 + offset, y2 = targetNode.y + (sameRow ? 0 : downward ? 0 : nodeHeight);
              const outer = link.route === 'outer-left';
              const path = outer ? `M ${x1} ${y1} H 250 V ${y2 + 105} H ${x2} V ${y2}` : sameRow ? `M ${x1} ${y1} V ${y1 - 22 - Math.abs(offset)} H ${x2} V ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`;
              const labelX = outer ? 440 : (x1 + x2) / 2;
              const labelY = outer ? y2 + 100 : sameRow ? y1 - 28 - Math.abs(offset) : (y1 + y2) / 2 - 8;
              const labelWidth = Math.max(54, link.speed.length * 7 + 14);
              return (
                <g key={link.id}>
                  <path d={path} fill="none"
                    stroke={strokeColor}
                    strokeWidth={link.linkType === 'fiber_40g' ? 7 : 5}
                    strokeDasharray={isDegraded || link.id === 'fitm-l-nat' ? '5,5' : 'none'}
                    opacity={0.15}
                  />
                  <path d={path} fill="none"
                    stroke={strokeColor}
                    strokeWidth={link.linkType === 'fiber_40g' ? 2.5 : 2}
                    strokeDasharray={isDegraded || link.id === 'fitm-l-nat' ? '5,5' : 'none'}
                    opacity={0.82}
                  />
                  {/* Speed Badge along link midpoint */}
                  <rect
                    x={labelX - labelWidth / 2}
                    y={labelY - 13}
                    width={labelWidth}
                    height="19"
                    rx="5"
                    fill="#ffffff"
                    stroke={isDegraded ? '#f59e0b' : '#bae6fd'}
                    opacity="0.98"
                    className={canEdit ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                    {...(canEdit ? {
                      onClick: (event: React.MouseEvent<SVGRectElement>) => {
                        event.stopPropagation();
                        setEditingLink(link);
                      },
                      'aria-label': `${lang === 'th' ? 'แก้ไขการเชื่อมต่อ' : 'Edit connection'} ${link.speed}`,
                    } : {})}
                  >
                    {canEdit && (
                      <title>{lang === 'th' ? 'คลิกเพื่อแก้ไขพอร์ตหรือข้อความบนเส้น' : 'Click to edit ports or connection label'}</title>
                    )}
                  </rect>
                  <text
                    x={labelX}
                    y={labelY}
                    fill={isDegraded ? '#b45309' : '#0369a1'}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {link.speed}
                  </text>
                </g>
              );
            })}
            {connectionDrag && (() => {
              const source = topologyNodes.find(node => node.id === connectionDrag.sourceId);
              if (!source) return null;
              const x1 = source.x + nodeWidth;
              const y1 = source.y + nodeHeight / 2;
              const target = connectionDrag.hoverTargetId
                ? topologyNodes.find(node => node.id === connectionDrag.hoverTargetId)
                : null;
              const x2 = target ? target.x : connectionDrag.x;
              const y2 = target ? target.y + nodeHeight / 2 : connectionDrag.y;
              const bend = x1 + (x2 - x1) / 2;
              const path = `M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`;
              return <>
                <path d={path} fill="none" stroke="#22d3ee" strokeWidth="8" opacity="0.18" />
                <path d={path} fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeDasharray="7 5" />
                <circle cx={x2} cy={y2} r="5" fill="#22d3ee" />
              </>;
            })()}
          </svg>

          {/* Render Topology Nodes */}
          {topologyNodes.map(node => {
            const isGroup = node.type === 'host_group' && node.groupCount !== undefined;
            return (
              <div
                key={node.id}
                onMouseDown={e => handleMouseDown(e, node)}
                onMouseEnter={() => setConnectionDrag(current => current && current.sourceId !== node.id
                  ? { ...current, hoverTargetId: node.id }
                  : current)}
                onMouseLeave={() => setConnectionDrag(current => current?.hoverTargetId === node.id
                  ? { ...current, hoverTargetId: null }
                  : current)}
                onMouseUp={e => finishConnectionDrag(e, node)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  cursor: editMode && canEdit ? 'grab' : 'pointer',
                  boxShadow: selectedNode?.id === node.id ? '0 0 0 3px rgba(6,182,212,.14), 0 12px 26px -18px rgba(15,23,42,.45)' : '0 10px 24px -18px rgba(15,23,42,.45)',
                }}
                className={`absolute w-[180px] min-h-[56px] rounded-xl bg-white/95 border px-2.5 py-2 hover:bg-cyan-50 z-10 ${draggedNodeId === node.id ? 'cursor-grabbing ring-2 ring-cyan-400/50' : 'transition-all duration-200 hover:-translate-y-0.5'} ${getNodeBorder(
                  node
                )} ${connectionDrag?.hoverTargetId === node.id ? 'ring-2 ring-cyan-300 border-cyan-300 scale-105' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md border border-slate-200 bg-slate-50 shadow-inner">{getNodeIcon(node.type)}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-800 truncate max-w-[120px]" title={node.label}>
                        {node.label}
                      </div>
                      <div className="text-[10px] font-semibold text-cyan-700 font-mono tracking-tight">{node.ip}</div>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full mt-1 ${
                      node.status === 'online'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.75)]'
                        : node.status === 'warning'
                        ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,.65)]'
                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,.65)]'
                    }`}
                  ></span>
                </div>

                {editMode && canEdit && (
                  <button
                    type="button"
                    onMouseDown={event => startConnectionDrag(event, node)}
                    className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-cyan-300 bg-cyan-600 shadow-[0_0_12px_rgba(34,211,238,.8)] cursor-crosshair hover:scale-125 hover:bg-cyan-400 transition-transform"
                    title={lang === 'th' ? 'ลากจากจุดนี้ไปยังอุปกรณ์ปลายทาง' : 'Drag to another device to connect'}
                    aria-label={lang === 'th' ? `ลากสายจาก ${node.label}` : `Connect from ${node.label}`}
                  >
                    <span className="block w-1.5 h-1.5 rounded-full bg-white mx-auto" />
                  </button>
                )}

                {/* Collapsible Subtree for Scalability (200-300 devices handling) */}
                {isGroup && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleSubtreeCollapse(node.id);
                      }}
                      className="w-full flex items-center justify-between text-slate-600 hover:text-cyan-700 font-mono"
                    >
                      <span className="font-bold text-cyan-700">+{node.groupCount} Nodes</span>
                      {node.isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {!node.isCollapsed && node.subClients && (
                      <div className="mt-1.5 space-y-1 text-[9px] text-slate-600 bg-slate-100 border border-slate-200 p-1.5 rounded">
                        {node.subClients.map((sub, i) => (
                          <div key={i} className="truncate">
                            • {sub}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Node in Edit Mode */}
                {editMode && canEdit && (
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditingNode(node); }}
                    className="absolute -bottom-3 right-2 rounded-md bg-cyan-600 px-2 py-1 text-xs text-white shadow-md hover:bg-cyan-500"
                    aria-label={`${lang === 'th' ? 'แก้ไข' : 'Edit'} ${node.label}`}
                  >{lang === 'th' ? 'แก้ไข' : 'Edit'}</button>
                )}
                {editMode && canEdit && (
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`ยืนยันการลบโหนด ${node.label} หรือไม่?`)) {
                        deleteTopologyNode(node.id);
                      }
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-rose-500"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              {getNodeIcon(selectedNode.type)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{selectedNode.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {TOPOLOGY_LAYERS[getTopologyTier(selectedNode) - 1].title}
                </span>
              </div>
              <div className="text-slate-500 font-mono mt-0.5">
                IP: {selectedNode.ip} · Status: <span className="text-emerald-500 font-semibold">{selectedNode.referenceOnly ? 'REFERENCE / NOT MONITORED' : selectedNode.status.toUpperCase()}</span>
                {selectedNode.model && ` · Model: ${selectedNode.model}`}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1 text-slate-600 dark:text-slate-300">
              <div className="font-semibold mb-2">VLAN / ข้อมูลจากภาพ · {selectedNode.location}</div>
              {selectedNode.notes?.map((note, i) => <p key={i} className="font-mono text-xs">{note}</p>)}
            </div>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="font-semibold">พอร์ตและการเชื่อมต่อ</div>
              {topologyLinks.filter(link => link.source === selectedNode.id || link.target === selectedNode.id).map(link => (
                <div key={link.id} className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs flex-1">{topologyNodes.find(node => node.id === link.source)?.label} → {topologyNodes.find(node => node.id === link.target)?.label}: {link.notes || link.speed}</p>
                  {canEdit && editMode && <>
                    <button onClick={() => setEditingLink(link)} className="rounded px-2 py-1 bg-cyan-600 text-white">{lang === 'th' ? 'แก้ไข' : 'Edit'}</button>
                    <button onClick={() => { if (confirm(lang === 'th' ? 'ลบการเชื่อมต่อนี้?' : 'Delete this connection?')) deleteTopologyLink(link.id); }} className="rounded px-2 py-1 text-rose-500">{lang === 'th' ? 'ลบ' : 'Delete'}</button>
                  </>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && <button onClick={() => { setEditMode(true); setEditingNode(selectedNode); }} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold">{lang === 'th' ? 'แก้ไขอุปกรณ์' : 'Edit device'}</button>}
            <button
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Close Info
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Node */}
      {canEdit && (editingNode || editingLink) && <TopologyEditor node={editingNode ?? undefined} link={editingLink ?? undefined} onClose={() => { setEditingNode(null); setEditingLink(null); }} />}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-500" />
                {t('addNode')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">ชื่อโหนด</label>
                <input
                  type="text"
                  required
                  value={newNode.label}
                  onChange={e => setNewNode({ ...newNode, label: e.target.value })}
                  placeholder="เช่น Edge-SW-Library"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('ipAddress')}</label>
                  <input
                    type="text"
                    required
                    value={newNode.ip}
                    onChange={e => setNewNode({ ...newNode, ip: e.target.value })}
                    placeholder="10.10.10.90"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">ระดับชั้น</label>
                  <select
                    value={newNode.tier}
                    onChange={e => {
                      const layer = TOPOLOGY_LAYERS[Number(e.target.value) - 1];
                      setNewNode({ ...newNode, tier: layer.tier, type: layer.type, model: '' });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {TOPOLOGY_LAYERS.map(layer => <option key={layer.tier} value={layer.tier}>{layer.tier} · {layer.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
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

      {/* Modal: Connect Cable */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-purple-500" />
                {t('connectCable')}
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectLink} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">โหนดต้นทาง</label>
                <select
                  value={sourceNodeId}
                  onChange={e => setSourceNodeId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">เลือกโหนดต้นทาง...</option>
                  {topologyNodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.ip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">โหนดปลายทาง</label>
                <select
                  value={targetNodeId}
                  onChange={e => setTargetNodeId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">เลือกโหนดปลายทาง...</option>
                  {topologyNodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.ip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{t('cableType')}</label>
                <select
                  value={linkType}
                  onChange={e => setLinkType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                >
                  <option value="fiber_40g">40 Gbps QSFP+ Fiber Backbone</option>
                  <option value="fiber_10g">10 Gbps SFP+ Fiber Optic</option>
                  <option value="copper_1g">1 Gbps Cat6 Copper Twisted Pair</option>
                  <option value="trunk">802.1Q Inter-Switch Trunk</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Connect Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

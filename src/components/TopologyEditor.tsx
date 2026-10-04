import React, { useEffect, useRef, useState } from 'react';
import { useNetworkData } from '../context/NetworkDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { TopologyNode, TopologyLink } from '../types';

type Props = { node?: TopologyNode; link?: TopologyLink; onClose: () => void };

export function TopologyEditor({ node, link, onClose }: Props) {
  const { updateTopologyNode, updateTopologyLink } = useNetworkData();
  const { lang } = useLanguage();
  const th = lang === 'th';
  const dialog = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState(node?.label ?? '');
  const [ip, setIp] = useState(node?.ip ?? '');
  const [model, setModel] = useState(node?.model ?? '');
  const [location, setLocation] = useState(node?.location ?? '');
  const [notes, setNotes] = useState(node ? (node.notes ?? []).join('\n') : link?.notes ?? '');
  const [speed, setSpeed] = useState(link?.speed ?? '');
  const [linkType, setLinkType] = useState<TopologyLink['linkType']>(link?.linkType ?? 'fiber_10g');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white';
  const field = (title: string, value: string, change: (value: string) => void, required = false) => (
    <label className="block space-y-1"><span>{title}</span><input autoFocus={title === (th ? 'ชื่ออุปกรณ์' : 'Device name')} className={inputClass} value={value} required={required} pattern={required ? '.*\\S.*' : undefined} onChange={e => change(e.target.value)} /></label>
  );
  return (
    <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="topology-editor-title" className="m-auto w-[min(92vw,480px)] max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-6 shadow-2xl backdrop:bg-slate-950/80">
      <form className="space-y-4 text-sm" onSubmit={event => {
        event.preventDefault();
        if (node) updateTopologyNode(node.id, { label: label.trim(), ip: ip.trim(), model: model.trim(), location: location.trim(), notes: notes.split('\n').map(line => line.trim()).filter(Boolean) });
        if (link) updateTopologyLink(link.id, { speed: speed.trim(), notes: notes.trim(), linkType });
        onClose();
      }}>
        <h2 id="topology-editor-title" className="text-lg font-bold">{node ? (th ? 'แก้ไขอุปกรณ์' : 'Edit device') : (th ? 'แก้ไขการเชื่อมต่อ' : 'Edit connection')}</h2>
        {node && <>
          {field(th ? 'ชื่ออุปกรณ์' : 'Device name', label, setLabel, true)}
          {field('IP / CIDR', ip, setIp)}
          {field(th ? 'รุ่น' : 'Model', model, setModel)}
          {field(th ? 'สถานที่' : 'Location', location, setLocation)}
        </>}
        {link && <>
          {field(th ? 'ข้อความบนเส้น / พอร์ต / ความเร็ว' : 'Connection label / ports / speed', speed, setSpeed, true)}
          <label className="block space-y-1"><span>{th ? 'ประเภทสาย' : 'Cable type'}</span>
            <select className={inputClass} value={linkType} onChange={e => setLinkType(e.target.value as TopologyLink['linkType'])}>
              <option value="fiber_10g">10 Gbps Fiber</option><option value="fiber_40g">40 Gbps Fiber</option><option value="copper_1g">1 Gbps Copper</option><option value="trunk">802.1Q Trunk</option>
            </select>
          </label>
        </>}
        <label className="block space-y-1"><span>{th ? 'หมายเหตุ / VLAN' : 'Notes / VLAN'}</span><textarea className={inputClass} rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        <p className="text-xs text-slate-500">{th ? 'บันทึกในเบราว์เซอร์นี้เมื่อกดบันทึก' : 'Saved in this browser when you select Save.'}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 bg-slate-100 dark:bg-slate-800">{th ? 'ยกเลิก' : 'Cancel'}</button>
          <button type="submit" className="rounded-lg px-4 py-2 bg-cyan-600 text-white">{th ? 'บันทึก' : 'Save'}</button>
        </div>
      </form>
    </dialog>
  );
}

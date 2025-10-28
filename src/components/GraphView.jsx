import React, { useMemo } from "react";

function getLinks(notes) {
  const titleToId = new Map();
  notes.forEach(n => titleToId.set((n.title||'').trim().toLowerCase(), n.id));
  const edges = [];
  notes.forEach(n => {
    const re = /\[\[([^\]]+)\]\]/g;
    let m;
    while ((m = re.exec(n.content || ''))) {
      const targetTitle = (m[1]||'').trim().toLowerCase();
      const to = titleToId.get(targetTitle);
      if (to) edges.push({ from: n.id, to });
    }
  });
  return edges;
}

export default function GraphView({ notes, onSelect, onCreateFromTitle }) {
  const edges = useMemo(() => getLinks(notes), [notes]);

  const circle = useMemo(() => {
    const r = Math.min(window.innerWidth, window.innerHeight) * 0.35;
    const cx = 600; // large viewport assumed; SVG will scroll if smaller
    const cy = 300;
    const pos = new Map();
    const n = Math.max(1, notes.length);
    notes.forEach((note, i) => {
      const a = (i / n) * Math.PI * 2;
      pos.set(note.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    });
    return pos;
  }, [notes]);

  const missingTargets = useMemo(() => {
    // collect wikilinks to non-existent notes
    const existing = new Set(notes.map(n => (n.title||'').trim().toLowerCase()));
    const missing = new Map(); // title -> count
    notes.forEach(n => {
      const re = /\[\[([^\]]+)\]\]/g;
      let m; while ((m = re.exec(n.content || ''))) {
        const t = (m[1]||'').trim().toLowerCase();
        if (!existing.has(t)) missing.set(t, (missing.get(t)||0)+1);
      }
    });
    return Array.from(missing.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20);
  }, [notes]);

  return (
    <div className="h-full w-full flex">
      <div className="flex-1 overflow-auto">
        <svg className="min-w-[1200px] min-h-[700px] bg-neutral-950" viewBox="0 0 1200 700">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#525252" />
            </marker>
          </defs>
          {edges.map((e,idx)=>{
            const a = circle.get(e.from); const b = circle.get(e.to);
            if (!a || !b) return null;
            return <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3f3f46" strokeWidth="1.5" markerEnd="url(#arrow)" />
          })}
          {notes.map(n => {
            const p = circle.get(n.id);
            if (!p) return null;
            return (
              <g key={n.id} onClick={()=>onSelect(n.id)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={20} fill="#1f2937" stroke="#52525b" />
                <text x={p.x} y={p.y+40} textAnchor="middle" fontSize="12" fill="#d4d4d8">{n.title||'Untitled'}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="w-80 border-l border-neutral-800 p-3">
        <div className="text-sm font-semibold mb-2">Unlinked mentions</div>
        <div className="text-xs text-neutral-400 mb-3">Create notes for referenced-but-missing links.</div>
        <div className="space-y-2">
          {missingTargets.length===0 && (
            <div className="text-sm text-neutral-500">No missing links.</div>
          )}
          {missingTargets.map(([title,count]) => (
            <div key={title} className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm">{title}</div>
                <div className="text-xs text-neutral-500">{count} references</div>
              </div>
              <button onClick={()=>onCreateFromTitle(title)} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs">Create</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

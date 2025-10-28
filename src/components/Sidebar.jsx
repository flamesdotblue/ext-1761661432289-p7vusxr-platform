import React, { useMemo, useState } from "react";
import { Trash2, FileText } from "lucide-react";

export default function Sidebar({ notes, activeId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const sorted = useMemo(() => notes, [notes]);

  return (
    <div className={`border-r border-neutral-800 bg-neutral-900/50 ${collapsed ? 'w-14' : 'w-80'} transition-all duration-200 overflow-hidden flex flex-col`}>
      <div className="h-10 flex items-center justify-between px-3 text-xs text-neutral-400">
        <div className="uppercase tracking-wider">Notes</div>
        <button onClick={()=>setCollapsed(c=>!c)} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700">{collapsed ? '>' : '<'}</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map(n => (
          <button
            key={n.id}
            onClick={()=>onSelect(n.id)}
            className={`group w-full flex items-start gap-3 px-3 py-3 border-b border-neutral-900/60 text-left ${activeId===n.id ? 'bg-neutral-800/70' : 'hover:bg-neutral-800/40'}`}
          >
            <div className="pt-0.5"><FileText className="h-4 w-4 text-neutral-400" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{n.title || 'Untitled'}</div>
              <div className="text-xs text-neutral-400 truncate">{(n.content || '').replace(/[#*_`\[\]]/g,'').slice(0,80)}</div>
              {!!(n.tags?.length) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {n.tags.slice(0,3).map(t=> (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">#{t}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={(e)=>{e.stopPropagation(); onDelete(n.id);}}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/40"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </button>
        ))}
        {sorted.length===0 && (
          <div className="px-4 py-6 text-sm text-neutral-400">No notes yet. Create one to get started.</div>
        )}
      </div>
    </div>
  );
}

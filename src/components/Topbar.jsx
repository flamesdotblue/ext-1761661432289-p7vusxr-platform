import React, { useState } from "react";
import { Plus, Network, Sparkles, Settings, Search } from "lucide-react";

export default function Topbar({ query, onQuery, onCreate, onToggleGraph, graphActive, aiKey, onSaveKey }) {
  const [open, setOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState(aiKey || "");

  return (
    <div className="border-b border-neutral-800 bg-neutral-900/70 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
        <div className="font-semibold tracking-tight">Nebula Notes</div>
        <div className="flex-1"></div>
        <div className="relative w-80 hidden md:block">
          <Search className="absolute left-2 top-2.5 h-5 w-5 text-neutral-500" />
          <input
            value={query}
            onChange={(e)=>onQuery(e.target.value)}
            placeholder="Search notes, tags, content..."
            className="w-full bg-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm">
          <Plus className="h-4 w-4" /> New
        </button>
        <button onClick={onToggleGraph} className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm ${graphActive ? "bg-violet-600 hover:bg-violet-500" : "bg-neutral-800 hover:bg-neutral-700"}`}>
          <Network className="h-4 w-4" /> Graph
        </button>
        <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm">
          <Sparkles className="h-4 w-4" /> AI
        </button>
        <button onClick={()=>setOpen(true)} className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-lg p-5">
            <div className="text-lg font-semibold mb-1">AI Settings</div>
            <div className="text-sm text-neutral-400 mb-4">Enter your OpenAI API key to enable AI features like summarization, Q&A, and refactoring. Your key is stored locally in this browser.</div>
            <label className="text-sm text-neutral-300">OpenAI API Key</label>
            <input
              value={keyDraft}
              onChange={(e)=>setKeyDraft(e.target.value)}
              placeholder="sk-..."
              className="mt-1 w-full bg-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setOpen(false)} className="px-3 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm">Close</button>
              <button onClick={()=>{onSaveKey(keyDraft); setOpen(false);}} className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

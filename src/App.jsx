import React, { useEffect, useMemo, useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import GraphView from "./components/GraphView";

function loadNotes() {
  try {
    const raw = localStorage.getItem("notes.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem("notes.v1", JSON.stringify(notes));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [notes, setNotes] = useState(() => loadNotes());
  const [activeId, setActiveId] = useState(() => notes[0]?.id || null);
  const [query, setQuery] = useState("");
  const [showGraph, setShowGraph] = useState(false);
  const [aiKey, setAiKey] = useState(() => localStorage.getItem("ai.key") || "");

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (!activeId && notes.length) setActiveId(notes[0].id);
  }, [notes, activeId]);

  const activeNote = useMemo(() => notes.find(n => n.id === activeId) || null, [notes, activeId]);

  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes.sort((a,b)=>b.updatedAt - a.updatedAt);
    const q = query.toLowerCase();
    return notes
      .filter(n => (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q) || (n.tags||[]).some(t=>t.toLowerCase().includes(q)))
      .sort((a,b)=>b.updatedAt - a.updatedAt);
  }, [notes, query]);

  function createNote() {
    const n = {
      id: uid(),
      title: "Untitled",
      content: "",
      tags: [],
      updatedAt: Date.now(),
    };
    setNotes(prev => [n, ...prev]);
    setActiveId(n.id);
  }

  function deleteNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeId === id) setActiveId(prev => {
      const remaining = notes.filter(n => n.id !== id);
      return remaining[0]?.id || null;
    });
  }

  function updateNote(partial) {
    if (!activeNote) return;
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, ...partial, updatedAt: Date.now() } : n));
  }

  function upsertNoteFromWikilink(title) {
    const existing = notes.find(n => n.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (existing) return existing.id;
    const n = {
      id: uid(),
      title: title.trim() || "Untitled",
      content: "",
      tags: [],
      updatedAt: Date.now(),
    };
    setNotes(prev => [n, ...prev]);
    return n.id;
  }

  function saveAiKey(key) {
    setAiKey(key);
    localStorage.setItem("ai.key", key);
  }

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <Topbar
        query={query}
        onQuery={setQuery}
        onCreate={createNote}
        onToggleGraph={() => setShowGraph(s => !s)}
        graphActive={showGraph}
        aiKey={aiKey}
        onSaveKey={saveAiKey}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          notes={filteredNotes}
          activeId={activeId}
          onSelect={setActiveId}
          onDelete={deleteNote}
        />
        <div className="flex-1 overflow-hidden">
          {showGraph ? (
            <GraphView
              notes={notes}
              onSelect={(id) => setActiveId(id)}
              onCreateFromTitle={(t)=> setActiveId(upsertNoteFromWikilink(t))}
            />
          ) : (
            <Editor
              note={activeNote}
              onChange={updateNote}
              allNotes={notes}
              onOpenLink={(title)=> setActiveId(upsertNoteFromWikilink(title))}
              aiKey={aiKey}
            />
          )}
        </div>
      </div>
    </div>
  );
}

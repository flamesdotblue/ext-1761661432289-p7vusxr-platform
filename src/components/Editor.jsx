import React, { useEffect, useMemo, useRef, useState } from "react";
import { Save, Sparkles } from "lucide-react";

function extractTags(content) {
  const set = new Set();
  const tagRegex = /(^|\s)#([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = tagRegex.exec(content))) set.add(m[2]);
  return Array.from(set);
}

function parseWikiLinks(content) {
  const re = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let m;
  while ((m = re.exec(content))) links.push(m[1].trim());
  return links;
}

function mdToHtml(md) {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, (m, code)=>`<pre class="bg-neutral-900 p-3 rounded border border-neutral-800 overflow-auto"><code>${code.replace(/\n/g,'<br/>')}</code></pre>`);
  html = html.replace(/^### (.*)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">$1</code>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a class="text-blue-400 hover:underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span data-wikilink="$1" class="text-violet-400 hover:underline cursor-pointer">[$1]</span>');
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  return html;
}

async function callOpenAI(key, messages) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
    }),
  });
  if (!r.ok) throw new Error("AI request failed");
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

export default function Editor({ note, onChange, allNotes, onOpenLink, aiKey }) {
  const [localTitle, setLocalTitle] = useState(note?.title || "");
  const [localContent, setLocalContent] = useState(note?.content || "");
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    setLocalTitle(note?.title || "");
    setLocalContent(note?.content || "");
  }, [note?.id]);

  useEffect(() => {
    if (!note) return;
    const tags = extractTags(localContent);
    onChange({ title: localTitle, content: localContent, tags });
  }, [localTitle, localContent]);

  const backlinks = useMemo(() => {
    if (!note) return [];
    const title = (note.title || "").trim().toLowerCase();
    return allNotes.filter(n => n.id !== note.id && (n.content||"").toLowerCase().includes(`[[${title}`)).slice(0,20);
  }, [note?.id, allNotes]);

  useEffect(() => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    function onClick(e){
      const t = e.target;
      if (t && t.dataset && t.dataset.wikilink) {
        onOpenLink(t.dataset.wikilink);
      }
    }
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [previewRef.current, onOpenLink]);

  async function runAi(prompt) {
    if (!aiKey) return alert('Add your OpenAI API key in AI settings.');
    try {
      setBusy(true);
      const content = await callOpenAI(aiKey, [
        { role: 'system', content: 'You are an expert writing assistant for a knowledge base. Keep structure, use concise bullet points where helpful.' },
        { role: 'user', content: prompt.replace('{note}', localContent) }
      ]);
      setLocalContent(prev => `${prev}\n\n---\nAI Output:\n${content}`);
    } catch (e) {
      alert('AI failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!note) return <div className="h-full w-full flex items-center justify-center text-neutral-500">Select or create a note.</div>;

  const links = parseWikiLinks(localContent);
  const html = mdToHtml(localContent);

  return (
    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col border-r border-neutral-800">
        <div className="p-3 flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/40">
          <input
            value={localTitle}
            onChange={(e)=>setLocalTitle(e.target.value)}
            placeholder="Note title"
            className="flex-1 bg-transparent text-lg font-semibold focus:outline-none"
          />
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-800 text-sm">
            <Save className="h-4 w-4" /> Saved
          </button>
        </div>
        <textarea
          value={localContent}
          onChange={(e)=>setLocalContent(e.target.value)}
          placeholder={'Write with Markdown. Use [[Wiki Links]] to connect notes. Use #tags anywhere.\n\nShortcuts: headings (#, ##, ###), code blocks (```), emphasis (*, **)'}
          className="flex-1 resize-none bg-neutral-950 text-neutral-100 p-4 focus:outline-none"
        />
        <div className="border-t border-neutral-800 p-2 flex items-center gap-2 overflow-x-auto text-xs text-neutral-300">
          <div className="opacity-70">Links:</div>
          {links.length === 0 ? (<span className="opacity-50">None</span>) : links.map(l => (
            <button key={l} onClick={()=>onOpenLink(l)} className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-violet-300">[[{l}]]</button>
          ))}
          <div className="mx-3 opacity-30">|</div>
          <button disabled={busy} onClick={()=>runAi('Summarize the following note into key bullet points and an executive summary.\n\n{note}')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> Summarize
          </button>
          <button disabled={busy} onClick={()=>runAi('Propose a cleaned-up, more structured rewrite of the note. Preserve facts.\n\n{note}')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> Refactor
          </button>
          <button disabled={busy} onClick={()=>runAi('Generate a list of useful links (as [[Wiki Links]]) that this note should connect to.\n\n{note}')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> Link Ideas
          </button>
        </div>
      </div>
      <div className="flex flex-col overflow-hidden">
        <div className="p-3 border-b border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
          <div className="text-sm text-neutral-400">Preview</div>
          {!!backlinks.length && (
            <div className="text-xs text-neutral-400">Backlinks: {backlinks.length}</div>
          )}
        </div>
        <div ref={previewRef} className="prose prose-invert max-w-none p-5 overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
        {!!backlinks.length && (
          <div className="border-t border-neutral-800 p-4">
            <div className="text-sm font-semibold mb-2">Backlinks</div>
            <div className="space-y-2">
              {backlinks.map(b => (
                <button key={b.id} onClick={()=>onOpenLink(b.title)} className="block w-full text-left p-2 rounded hover:bg-neutral-900/60">
                  <div className="text-sm font-medium">{b.title || 'Untitled'}</div>
                  <div className="text-xs text-neutral-400 truncate">{(b.content||'').slice(0,120)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

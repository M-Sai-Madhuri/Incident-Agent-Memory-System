import React, { useState } from 'react';
import { Search, Brain, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function MemoryExplorer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [reflection, setReflection] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);

  const handleSearch = async (action) => {
    setLoadingAction(action);
    try {
      const res = await fetch(`http://localhost:8000/api/memory/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (action === 'recall') {
        setResults(data);
        setReflection('');
      } else {
        setReflection(data.reflection);
        setResults([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingAction(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary">Memory Explorer</h1>
        <p className="text-secondary mt-1">Search organizational memory directly.</p>
      </div>

      <div className="bg-surface border border-border p-5 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-secondary" size={18} />
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-accent/20 outline-none"
            placeholder="Ask the organization's memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => handleSearch('recall')}
            className="bg-primary hover:opacity-90 text-surface px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            {loadingAction === 'recall' ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
            Recall (Search)
          </button>
          <button 
            onClick={() => handleSearch('reflect')}
            className="bg-purple-600 hover:opacity-90 text-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            {loadingAction === 'reflect' ? <Loader2 size={16} className="animate-spin"/> : <Brain size={16}/>}
            Reflect (Synthesize)
          </button>
        </div>
      </div>

      {reflection && (
        <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-5">
          <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Brain size={16}/> Reflection
          </h3>
          <div className="text-sm text-primary/90 leading-relaxed">
            <ReactMarkdown 
              components={{
                h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-3 mb-2 text-primary" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-primary" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold mt-3 mb-2 text-primary" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
              }}
            >
              {reflection}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 dark:bg-white/10 text-secondary border border-border uppercase tracking-wide">
                  {r.type}
                </span>
                <span className="text-xs monospace font-medium text-secondary">
                  {r.metadata?.incident_id || r.metadata?.postmortem_id || r.metadata?.runbook_id}
                </span>
              </div>
              <div className="text-sm font-medium text-primary">
                {typeof r.content === 'object' ? (r.content.summary || r.content.lesson_learned || r.content.title) : r.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

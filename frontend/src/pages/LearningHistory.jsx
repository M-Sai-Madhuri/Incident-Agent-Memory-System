import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export function LearningHistory() {
  const [postmortems, setPostmortems] = useState([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/postmortems')
      .then(r => r.json())
      .then(d => setPostmortems(d));
  }, []);

  const filteredData = postmortems.filter(pm => {
    const s = search.toLowerCase();
    const matches = (val) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(s));
      return String(val).toLowerCase().includes(s);
    };
    
    return matches(pm.service) || 
           matches(pm.lesson_learned) || 
           matches(pm.what_worked) || 
           matches(pm.what_failed) || 
           matches(pm.incident_id);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Learning History</h1>
          <p className="text-secondary mt-1">What the organization learned over time.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredData.slice().reverse().map((pm, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-primary">{pm.lesson_learned || 'Incident Review'}</div>
              <div className="text-xs font-medium monospace text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{pm.postmortem_id || `PM-${pm.incident_id}`}</div>
            </div>
            <div className="text-sm font-medium text-secondary mb-4 uppercase tracking-wider">{pm.service}</div>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-bold text-xs uppercase tracking-wider text-success mb-2">What Worked</div>
                <div className="text-primary/90">{Array.isArray(pm.what_worked) ? pm.what_worked.join(', ') : (pm.what_worked || 'N/A')}</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase tracking-wider text-error mb-2">What Failed</div>
                <div className="text-primary/90">{Array.isArray(pm.what_failed) ? pm.what_failed.join(', ') : (pm.what_failed || 'N/A')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';

export function Postmortems() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/postmortems')
      .then(r => r.json())
      .then(d => setData(d));
  }, []);

  const filteredData = data.filter(pm => 
    (pm.service && pm.service.toLowerCase().includes(search.toLowerCase())) ||
    (pm.root_cause && pm.root_cause.toLowerCase().includes(search.toLowerCase())) ||
    (pm.lesson_learned && pm.lesson_learned.toLowerCase().includes(search.toLowerCase())) ||
    (pm.postmortem_id && pm.postmortem_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Postmortems</h1>
          <p className="text-secondary mt-1">Historical incident reviews.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search postmortems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-black/5 dark:bg-white/5 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-secondary">ID</th>
              <th className="px-4 py-3 font-medium text-secondary">SERVICE</th>
              <th className="px-4 py-3 font-medium text-secondary">ROOT CAUSE</th>
              <th className="px-4 py-3 font-medium text-secondary">LESSON LEARNED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.map((pm, i) => (
              <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 monospace font-medium text-accent align-top whitespace-nowrap">{pm.postmortem_id}</td>
                <td className="px-4 py-4 align-top whitespace-nowrap">{pm.service}</td>
                <td className="px-4 py-4 align-top">{pm.root_cause}</td>
                <td className="px-4 py-4 align-top text-secondary">{pm.lesson_learned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

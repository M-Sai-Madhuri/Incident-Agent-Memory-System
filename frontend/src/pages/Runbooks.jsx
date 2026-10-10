import React, { useEffect, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';

export function Runbooks() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/runbooks')
      .then(r => r.json())
      .then(d => setData(d));
  }, []);

  const filteredData = data.filter(rb => 
    (rb.service && rb.service.toLowerCase().includes(search.toLowerCase())) ||
    (rb.title && rb.title.toLowerCase().includes(search.toLowerCase())) ||
    (rb.runbook_id && rb.runbook_id.toLowerCase().includes(search.toLowerCase())) ||
    (rb.symptoms && rb.symptoms.some(s => s.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Runbooks</h1>
          <p className="text-secondary mt-1">Standard operating procedures.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search runbooks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredData.map((rb, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-primary">{rb.title}</div>
              <div className="text-xs font-medium monospace text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{rb.runbook_id}</div>
            </div>
            <div className="text-sm font-medium text-secondary mb-4">{rb.service}</div>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-bold text-xs uppercase tracking-wider text-secondary mb-2">Symptoms</div>
                <ul className="list-disc pl-4 space-y-1">
                  {rb.symptoms?.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div className="font-bold text-xs uppercase tracking-wider text-secondary mb-2">Resolution</div>
                <ul className="list-disc pl-4 space-y-1">
                  {rb.resolution?.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
            </div>
            {rb.warnings?.length > 0 && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md text-sm text-warning/90 font-medium">
                ⚠️ {rb.warnings.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

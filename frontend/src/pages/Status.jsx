import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle, Database, Brain, Activity, Clock } from 'lucide-react';

export function Status() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(r => r.json())
      .then(d => setStats(d));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary">Hindsight Status</h1>
        <p className="text-secondary mt-1">System health and integrations.</p>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm p-8">
        
        <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
          <div>
            <h2 className="font-bold text-lg text-primary mb-1">Hindsight Connection</h2>
            <div className="text-sm text-secondary">Vector database status</div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-md">
            <CheckCircle className="text-success" size={20} />
            <span className="font-bold text-success uppercase tracking-wider text-sm">Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-border">
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Memory Bank</div>
            <div className="font-medium monospace text-primary bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded border border-border inline-block">
              {stats?.bank_id || "incident-response"}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Fallback Mode</div>
            <div className="text-sm font-medium text-primary">Standby (Available if LLM drops)</div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-bold text-sm text-primary uppercase tracking-wider">Operations Health</h2>
          
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Database className="text-accent" size={20} />
              <div className="font-medium text-primary">Recall</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
              <Clock size={14}/> Just now
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Brain className="text-accent" size={20} />
              <div className="font-medium text-primary">Reflect</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
              <Clock size={14}/> Just now
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Activity className="text-accent" size={20} />
              <div className="font-medium text-primary">Retain</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
              <Clock size={14}/> 2 minutes ago
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

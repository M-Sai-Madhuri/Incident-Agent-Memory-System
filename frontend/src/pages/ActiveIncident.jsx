import React, { useState } from 'react';
import { TriangleAlert, Brain, History, CheckCircle, XCircle, AlertTriangle, PlayCircle } from 'lucide-react';

export function ActiveIncident() {
  const [memoryMode, setMemoryMode] = useState(true);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [result, setResult] = useState(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isLearned, setIsLearned] = useState(false);
  const [disapprovalState, setDisapprovalState] = useState(null);
  
  const DEMO_SCENARIOS = [
    {
      service: 'Payment API', severity: 'SEV-1', error: 'HTTP 502 Bad Gateway', error_rate: '42%',
      recent_deployment: 'payment-service-v2.8.1', deployment_time: '8 minutes ago', db_utilization: '94%',
      description: 'Payment API is returning 42 percent HTTP 502 errors.\nA deployment occurred 8 minutes ago.\nDatabase utilization is 94 percent.'
    },
    {
      service: 'Redis Cache', severity: 'SEV-2', error: 'OOM / Eviction', error_rate: '15%',
      recent_deployment: 'None', deployment_time: 'N/A', db_utilization: '100%',
      description: 'Redis is evicting keys rapidly and at 100% memory utilization.'
    },
    {
      service: 'Kubernetes Cluster', severity: 'SEV-1', error: 'CrashLoopBackOff', error_rate: '100%',
      recent_deployment: 'worker-v2.0', deployment_time: '5 minutes ago', db_utilization: '20%',
      description: 'Pods are entering CrashLoopBackOff immediately after startup.'
    },
    {
      service: 'Kafka Queue', severity: 'SEV-2', error: 'Consumer Lag Spiking', error_rate: 'N/A',
      recent_deployment: 'None', deployment_time: 'N/A', db_utilization: '45%',
      description: 'Kafka consumer lag on the orders topic has exceeded 500,000 messages and is growing.'
    },
    {
      service: 'Postgres DB', severity: 'SEV-1', error: 'Connection Pool Exhausted', error_rate: '80%',
      recent_deployment: 'None', deployment_time: 'N/A', db_utilization: '100%',
      description: 'Database is refusing new connections. Applications are failing to read or write data.'
    },
    {
      service: 'Search Indexer', severity: 'SEV-2', error: 'Query Timeouts', error_rate: '25%',
      recent_deployment: 'search-v1.4', deployment_time: '1 hour ago', db_utilization: '60%',
      description: 'Elasticsearch query latencies have spiked to >5s causing upstream timeouts.'
    },
    {
      service: 'Notification Gateway', severity: 'SEV-3', error: 'Provider Throttling', error_rate: '12%',
      recent_deployment: 'None', deployment_time: 'N/A', db_utilization: '15%',
      description: 'SMS provider is returning 429 Too Many Requests for 2FA messages.'
    },
    {
      service: 'Load Balancer', severity: 'SEV-1', error: '504 Gateway Timeout', error_rate: '65%',
      recent_deployment: 'infra-update', deployment_time: '20 minutes ago', db_utilization: 'N/A',
      description: 'Nginx is reporting widespread 504 timeouts to backend application servers.'
    },
    {
      service: 'Checkout Worker', severity: 'SEV-2', error: 'High CPU Usage', error_rate: '5%',
      recent_deployment: 'checkout-v3.1', deployment_time: '2 hours ago', db_utilization: '30%',
      description: 'Worker nodes are pegging at 100% CPU, causing slow processing of background jobs.'
    },
    {
      service: 'Image Processing', severity: 'SEV-2', error: 'Disk Space Full', error_rate: '100%',
      recent_deployment: 'None', deployment_time: 'N/A', db_utilization: '5%',
      description: 'The /tmp volume on the image processing instances is at 100% capacity.'
    }
  ];

  const [form, setForm] = useState(() => {
    return DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
  });

  const [pmForm, setPmForm] = useState({
    root_cause: '',
    what_worked: '',
    what_failed: '',
    lesson_learned: '',
    prevention: ''
  });

  const handleInvestigate = async () => {
    setIsInvestigating(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/incidents/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, memory_mode: memoryMode })
      });
      const data = await res.json();
      setResult(data);
      // Track searched stat
      fetch('http://localhost:8000/api/users/me/stats/searched', { method: 'POST' }).catch(console.error);
    } catch (e) {
      console.error(e);
    }
    setIsInvestigating(false);
  };

  const handleTeachMemory = async () => {
    try {
      await fetch('http://localhost:8000/api/postmortems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: 'INC-NEW-1048',
          service: form.service,
          ...pmForm,
          resolution: 'Applied fix'
        })
      });
      // Track postmortem stat
      fetch('http://localhost:8000/api/users/me/stats/postmortems', { method: 'POST' }).catch(console.error);
      setIsLearned(true);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDemo = (type) => {
    if (type === 'payment') {
      setForm({
        service: 'Payment API', severity: 'SEV-1', error: 'HTTP 502 Bad Gateway', error_rate: '42%',
        recent_deployment: 'payment-service-v2.8.1', deployment_time: '8 minutes ago', db_utilization: '94%',
        description: 'Payment API is returning 42 percent HTTP 502 errors.'
      });
    } else if (type === 'redis') {
      setForm({
        service: 'Redis Cache', severity: 'SEV-2', error: 'OOM / Eviction', error_rate: '15%',
        recent_deployment: 'None', deployment_time: 'N/A', db_utilization: '100%',
        description: 'Redis is evicting keys rapidly and at 100% memory utilization.'
      });
    } else if (type === 'k8s') {
      setForm({
        service: 'Kubernetes Cluster', severity: 'SEV-1', error: 'CrashLoopBackOff', error_rate: '100%',
        recent_deployment: 'worker-v2.0', deployment_time: '5 minutes ago', db_utilization: '20%',
        description: 'Pods are entering CrashLoopBackOff immediately after startup.'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Active Incident</h1>
          <p className="text-secondary mt-1">Investigate with organizational memory.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm">
        <div className="border-b border-border p-4 bg-black/5 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold monospace text-primary">INC-NEW-1048</div>
            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/20 uppercase tracking-wide">
              {form.severity}
            </div>
            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 uppercase tracking-wide">
              INVESTIGATING
            </div>
          </div>
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-1 border border-border">
            <button 
              onClick={() => setMemoryMode(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!memoryMode ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
            >
              WITHOUT MEMORY
            </button>
            <button 
              onClick={() => setMemoryMode(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${memoryMode ? 'bg-surface shadow-sm text-accent' : 'text-secondary hover:text-primary'}`}
            >
              WITH MEMORY
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Service</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none" value={form.service} onChange={e => setForm({...form, service: e.target.value})} />
                </div>
                <div>
                  <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Severity</label>
                  <select className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none bg-surface" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                    <option>SEV-1</option><option>SEV-2</option><option>SEV-3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Error Rate</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none" value={form.error_rate} onChange={e => setForm({...form, error_rate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-secondary text-xs uppercase tracking-wider mb-1">DB Utilization</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none" value={form.db_utilization} onChange={e => setForm({...form, db_utilization: e.target.value})} />
                </div>
                <div>
                  <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Recent Deployment</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none" value={form.recent_deployment} onChange={e => setForm({...form, recent_deployment: e.target.value})} />
                </div>
                <div>
                  <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Deployment Time</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none" value={form.deployment_time} onChange={e => setForm({...form, deployment_time: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Symptoms / Error</label>
                <input type="text" className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none" value={form.error} onChange={e => setForm({...form, error: e.target.value})} />
              </div>
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-1">Description</label>
                <textarea className="w-full border border-border rounded-md px-3 py-1.5 text-sm outline-none h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border flex justify-end">
            <button 
              onClick={handleInvestigate}
              disabled={isInvestigating}
              className="bg-primary hover:opacity-90 text-surface px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isInvestigating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Brain size={16}/>}
              {isInvestigating ? 'Analyzing...' : 'Investigate Incident'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Memory Pipeline */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2 w-32">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${memoryMode ? 'bg-accent/10 text-accent ring-4 ring-accent/5' : 'bg-black/5 dark:bg-white/10 text-secondary'}`}>
                <Brain size={14} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide">Recall</div>
              <div className="text-[10px] text-secondary">{memoryMode ? `${(result?.similar_incidents?.length || 0) + (result?.lessons?.length || 0)} memories` : 'Skipped'}</div>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex flex-col items-center gap-2 w-32">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${memoryMode ? 'bg-purple-100 text-purple-600 ring-4 ring-purple-50' : 'bg-black/5 dark:bg-white/10 text-secondary'}`}>
                <Brain size={14} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide">Reflect</div>
              <div className="text-[10px] text-secondary">{memoryMode ? 'Synthesized' : 'Skipped'}</div>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex flex-col items-center gap-2 w-32">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center ring-4 ring-green-50">
                <CheckCircle size={14} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide">Recommend</div>
              <div className="text-[10px] text-secondary">Plan Generated</div>
            </div>
          </div>

          {/* Reflection Panel */}
          {memoryMode && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Brain className="text-accent mt-0.5 shrink-0" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-1">Hindsight Reflection</h3>
                  <p className="text-sm text-primary/80 leading-relaxed">
                    {result?.structured_recommendation?.memory_insight || result?.reflection || "No reflection available."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col */}
            <div className="space-y-6">
              
              <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="border-b border-border bg-black/5 dark:bg-white/5 px-4 py-3 font-semibold text-sm uppercase tracking-wider flex items-center justify-between">
                  Historical Match
                  {result?.structured_recommendation?.historical_match?.level === 'strong' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">STRONG</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 dark:bg-white/10 text-secondary border border-border">NONE</span>
                  )}
                </div>
                <div className="p-4 text-sm text-secondary">
                  {result?.structured_recommendation?.historical_match?.summary || "No historical match found."}
                </div>
              </div>

              {(result?.structured_recommendation?.actions_to_avoid?.length > 0) && (
                <div className="bg-error/5 border border-error/20 rounded-lg p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-2 mb-3">
                    <AlertTriangle size={14}/> Actions to Avoid
                  </h3>
                  <ul className="space-y-2">
                    {result.structured_recommendation.actions_to_avoid.map((a, i) => (
                      <li key={i} className="text-sm text-error/90 flex items-start gap-2">
                        <XCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(result?.structured_recommendation?.successful_historical_actions?.length > 0) && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-2 mb-3">
                    <CheckCircle size={14}/> What Worked Before
                  </h3>
                  <ul className="space-y-2">
                    {result.structured_recommendation.successful_historical_actions.map((a, i) => (
                      <li key={i} className="text-sm text-success/90 flex items-start gap-2">
                        <CheckCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Right Col */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-surface border border-border rounded-lg shadow-sm">
                <div className="border-b border-border bg-black/5 dark:bg-white/5 px-5 py-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Recommended Investigation</h3>
                  <p className="text-xs text-secondary mt-1">{memoryMode ? "Based on current signals and organizational memory." : "Based on general SRE best practices (no memory used)."}</p>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {result?.structured_recommendation?.recommended_actions?.map((action, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-secondary shrink-0">
                          0{i+1}
                        </div>
                        <div className="pt-0.5">
                          <p className="text-sm font-medium text-primary mb-1">{action}</p>
                          {(result?.structured_recommendation?.evidence?.length > 0) && memoryMode && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Evidence:</span>
                              <span className="text-[10px] monospace bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-secondary">
                                {result.structured_recommendation.evidence[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Approval */}
              {!isResolved && !disapprovalState && (
                <div className="bg-surface border border-border rounded-lg shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Human Review Required</h3>
                    <p className="text-xs text-secondary mt-1">These recommendations are advisory. Review before taking action.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { 
                        setIsResolved(true); 
                        setDisapprovalState(null); 
                        // Track approved stat
                        fetch('http://localhost:8000/api/users/me/stats/approved', { method: 'POST' }).catch(console.error);
                      }}
                      className="bg-accent hover:opacity-90 text-white dark:text-slate-900 px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      Approve & Resolve Incident
                    </button>
                    <button 
                      onClick={() => { 
                        setDisapprovalState('ask'); 
                        setIsResolved(false); 
                        // Track declined stat
                        fetch('http://localhost:8000/api/users/me/stats/declined', { method: 'POST' }).catch(console.error);
                      }}
                      className="bg-error hover:opacity-90 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      Disapprove
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION FLOW */}
      {isResolved && !isLearned && (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden animate-in zoom-in-95 duration-300 mt-6">
          <div className="bg-success/10 border-b border-border p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-success" size={24} />
            </div>
            <h2 className="text-lg font-bold text-success uppercase tracking-wider">Incident Resolved</h2>
            <p className="text-sm text-success/80 mt-1">Now, capture what we learned.</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Root Cause</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                    value={pmForm.root_cause} onChange={e => setPmForm({...pmForm, root_cause: e.target.value})} placeholder="What caused the incident?" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">What Worked</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                    value={pmForm.what_worked} onChange={e => setPmForm({...pmForm, what_worked: e.target.value})} placeholder="Which action resolved it?" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">What Failed</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                    value={pmForm.what_failed} onChange={e => setPmForm({...pmForm, what_failed: e.target.value})} placeholder="Did any action fail or worsen it?" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Lesson Learned</label>
                  <textarea className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none h-24 resize-none" 
                    value={pmForm.lesson_learned} onChange={e => setPmForm({...pmForm, lesson_learned: e.target.value})} placeholder="What should we remember next time?" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Prevention</label>
                  <input type="text" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                    value={pmForm.prevention} onChange={e => setPmForm({...pmForm, prevention: e.target.value})} placeholder="How do we prevent this?" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleTeachMemory}
                className="bg-primary hover:opacity-90 text-surface px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                <Brain size={16}/> Teach Organizational Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEARNING CONFIRMATION */}
      {isLearned && (
        <div className="bg-surface border border-success/30 rounded-lg shadow-sm p-8 text-center animate-in zoom-in-95 duration-500 mt-6">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="text-success" size={32} />
          </div>
          <h2 className="text-xl font-bold text-primary tracking-tight mb-2">Memory Updated</h2>
          <p className="text-secondary text-sm mb-6">Organizational memory has been updated and will be recalled in future incidents.</p>
          
          <div className="bg-black/5 dark:bg-white/5 border border-border rounded-lg p-5 max-w-xl mx-auto text-left space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Incident</span>
              <span className="text-xs monospace font-medium">INC-NEW-1048</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">Learned</span>
              <span className="text-sm font-medium text-primary">{pmForm.lesson_learned || "No lesson provided"}</span>
            </div>
          </div>
        </div>
      )}

      {/* DISAPPROVED FLOW */}
      {disapprovalState === 'ask' && !isResolved && (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden animate-in zoom-in-95 duration-300 mt-6">
          <div className="bg-error/10 border-b border-border p-6 text-center">
            <h2 className="text-lg font-bold text-error uppercase tracking-wider">Incident Disapproved</h2>
            <p className="text-sm text-error/80 mt-2">Do we need to analyse it again?</p>
            <div className="flex gap-3 justify-center mt-4">
              <button 
                onClick={() => {
                  setDisapprovalState(null);
                  handleInvestigate();
                }}
                className="bg-accent hover:opacity-90 text-white dark:text-slate-900 px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Yes
              </button>
              <button 
                onClick={() => setDisapprovalState('no')}
                className="bg-surface border border-border hover:bg-black/5 dark:hover:bg-white/5 text-primary px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISAPPROVED NO FLOW */}
      {disapprovalState === 'no' && !isResolved && (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden animate-in zoom-in-95 duration-300 mt-6">
          <div className="p-6 text-center">
            <h2 className="text-lg font-bold text-primary uppercase tracking-wider">Okay try with new incident</h2>
          </div>
        </div>
      )}

    </div>
  );
}

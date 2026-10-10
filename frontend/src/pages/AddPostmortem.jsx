import React, { useState } from 'react';
import { Brain, CheckCircle, PlusCircle } from 'lucide-react';

export function AddPostmortem() {
  const [form, setForm] = useState({
    stream: 'SRE',
    service: '',
    root_cause: '',
    what_worked: '',
    what_failed: '',
    resolution: '',
    lesson_learned: '',
    prevention: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/postmortems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setForm({
          stream: 'SRE',
          service: '',
          root_cause: '',
          what_worked: '',
          what_failed: '',
          resolution: '',
          lesson_learned: '',
          prevention: ''
        });
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary">Contribute Memory</h1>
        <p className="text-secondary mt-1">Add your experience to the organizational brain.</p>
      </div>

      <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Stream / Team</label>
              <select 
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none bg-surface" 
                value={form.stream} 
                onChange={e => setForm({...form, stream: e.target.value})} 
              >
                <option value="SRE">SRE</option>
                <option value="DEV">DevOps</option>
                <option value="SWE">Software Engineering</option>
                <option value="SEC">Security</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Service / Component</label>
              <input 
                type="text" 
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                value={form.service} 
                onChange={e => setForm({...form, service: e.target.value})} 
                placeholder="e.g. payment-gateway" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Root Cause</label>
            <input 
              type="text" 
              required
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
              value={form.root_cause} 
              onChange={e => setForm({...form, root_cause: e.target.value})} 
              placeholder="What was the actual underlying cause?" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">What Worked (comma separated)</label>
              <input 
                type="text" 
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                value={form.what_worked} 
                onChange={e => setForm({...form, what_worked: e.target.value})} 
                placeholder="e.g. Restarted pods, Rolled back DB" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">What Failed (comma separated)</label>
              <input 
                type="text" 
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                value={form.what_failed} 
                onChange={e => setForm({...form, what_failed: e.target.value})} 
                placeholder="e.g. Flushing Redis cache didn't help" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Lessons Learned</label>
            <textarea 
              required
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none h-24 resize-none" 
              value={form.lesson_learned} 
              onChange={e => setForm({...form, lesson_learned: e.target.value})} 
              placeholder="What is the main takeaway from this incident?" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Resolution Steps (comma separated)</label>
              <input 
                type="text" 
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                value={form.resolution} 
                onChange={e => setForm({...form, resolution: e.target.value})} 
                placeholder="e.g. Increased limits, Redeployed" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Action Items / Prevention (comma separated)</label>
              <input 
                type="text" 
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none" 
                value={form.prevention} 
                onChange={e => setForm({...form, prevention: e.target.value})} 
                placeholder="e.g. Setup alerts, Fix config" 
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            {isSuccess ? (
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <CheckCircle size={18} /> Memory Successfully Retained!
              </div>
            ) : <div></div>}
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:opacity-90 text-surface px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : (
                <Brain size={16}/>
              )}
              {isSubmitting ? 'Retaining Memory...' : 'Teach Organization Memory'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

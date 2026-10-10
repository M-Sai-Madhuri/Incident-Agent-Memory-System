import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Database, CheckCircle, Brain, RefreshCw, Users, Edit, Eye, EyeOff, BarChart2, Medal } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, subtitle }) => (
  <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">{title}</h3>
      <Icon className="text-accent opacity-80" size={20} />
    </div>
    <div className="text-3xl font-bold text-primary mb-1">{value}</div>
    {subtitle && <div className="text-xs text-secondary">{subtitle}</div>}
  </div>
);

export function Overview() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [promptPasswordUser, setPromptPasswordUser] = useState(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [editForm, setEditForm] = useState({ id: '', username: '', email: '', role: '', new_password: '' });
  const [createForm, setCreateForm] = useState({ id: '', username: '', email: '', role: '', password: '', confirm_password: '' });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/users/me')
      .then(r => r.json())
      .then(data => setCurrentUser(data));

    fetch('http://localhost:8000/api/health')
      .then(r => r.json())
      .then(data => setStats(data));

    fetch('http://localhost:8000/api/incidents')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setIncidents(data.slice(-5));
      });
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'manager') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = () => {
    fetch('http://localhost:8000/api/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await window.fetch(`http://localhost:8000/api/users/${editingUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        alert("User details updated successfully!");
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert("Error: " + data.detail);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirm_password) {
      return alert("Password and Confirm Password do not match.");
    }
    
    // Validate strong password
    const pwd = createForm.password;
    if (pwd.length < 8) return alert("Password must be at least 8 characters long.");
    if (!/[A-Z]/.test(pwd)) return alert("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(pwd)) return alert("Password must contain at least one lowercase letter.");
    if (!/[0-9]/.test(pwd)) return alert("Password must contain at least one number.");
    if (!/[^A-Za-z0-9]/.test(pwd)) return alert("Password must contain at least one special character.");

    try {
      const res = await window.fetch('http://localhost:8000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: createForm.id,
          username: createForm.username,
          email: createForm.email,
          role: createForm.role,
          password: createForm.password
        })
      });
      if (res.ok) {
        alert("User created successfully!");
        setIsCreatingUser(false);
        setCreateForm({ id: '', username: '', email: '', role: '', password: '', confirm_password: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        alert("Error: " + data.detail);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleRevealPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await window.fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: currentUser.id, 
          username: currentUser.username, 
          email: currentUser.email, 
          password: adminPasswordInput, 
          role: currentUser.role 
        })
      });
      if (res.ok) {
        setShowPasswords(prev => ({...prev, [promptPasswordUser]: true}));
        setPromptPasswordUser(null);
        setAdminPasswordInput('');
      } else {
        alert("Incorrect Admin Password.");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  if (!currentUser) return <div className="p-8">Loading dashboard...</div>;

  // USER DASHBOARD (Non-manager)
  if (currentUser.role !== 'manager') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Incident Operations</h1>
          <p className="text-secondary mt-1">Welcome back, {currentUser.username}. Understand incidents through organizational memory.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Active Incidents" value="1" icon={Activity} subtitle="Investigating" />
          <MetricCard title="Historical Memory" value={stats ? `140+` : '...'} icon={Database} subtitle="Incidents & PMs" />
          <MetricCard title="Memory Records" value={stats ? `300+` : '...'} icon={Brain} subtitle="Hindsight Cloud" />
          <MetricCard title="Hindsight" value={stats?.hindsight_connected ? 'Connected' : 'Demo Mode'} icon={CheckCircle} subtitle={`Bank: ${stats?.bank_id || '...'}`} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-secondary uppercase tracking-wider border-b border-border pb-2">Recent Incidents</h2>
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium text-secondary">ID</th>
                  <th className="px-4 py-3 font-medium text-secondary">SERVICE</th>
                  <th className="px-4 py-3 font-medium text-secondary">SEVERITY</th>
                  <th className="px-4 py-3 font-medium text-secondary">ROOT CAUSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((inc, i) => (
                  <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 monospace text-accent">{inc.incident_id}</td>
                    <td className="px-4 py-3 monospace text-xs">{inc.service}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/20">
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-xs">{inc.root_cause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD (Manager)
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-primary tracking-tight">Admin Dashboard</h1>
        <p className="text-secondary mt-1">Manage system operations and personnel access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Number of Users" value={users.length || '...'} icon={Users} subtitle="Registered Staff" />
        <MetricCard title="Historical Memory" value={stats ? `140+` : '...'} icon={Database} subtitle="Incidents & PMs" />
        <MetricCard title="Memory Records" value={stats ? `300+` : '...'} icon={Brain} subtitle="Hindsight Cloud" />
        <MetricCard title="Hindsight" value={stats?.hindsight_connected ? 'Connected' : 'Demo Mode'} icon={CheckCircle} subtitle={`Bank: ${stats?.bank_id || '...'}`} />
      </div>

      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-bold text-secondary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
          <Medal size={16} className="text-warning" /> Top Performing Analysts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users
            .map(u => {
              const s = u.stats || {};
              const totalActivity = (s.searched || 0) + (s.approved || 0) + (s.declined || 0) + (s.postmortems || 0);
              return { ...u, totalActivity };
            })
            .sort((a, b) => b.totalActivity - a.totalActivity)
            .slice(0, 3)
            .map((u, i) => (
              <Link to={`/user/${u.id}/analytics`} key={u.id} className="bg-surface border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-warning"></div>}
                {i === 1 && <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>}
                {i === 2 && <div className="absolute top-0 left-0 w-full h-1 bg-amber-700"></div>}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-lg text-primary">{u.username}</div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-slate-300' : 'bg-amber-700'}`}>
                    #{i + 1}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary">Total Activity</span>
                  <span className="font-bold text-accent">{u.totalActivity} actions</span>
                </div>
              </Link>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-sm font-bold text-secondary uppercase tracking-wider">User Details</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setCreateForm({ id: '', username: '', email: '', role: 'manager', password: '', confirm_password: '' });
                setIsCreatingUser(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-white text-xs font-semibold rounded hover:opacity-90 transition-opacity"
            >
              <Users size={14} /> Add New Admin
            </button>
            <button 
              onClick={() => {
                setCreateForm({ id: '', username: '', email: '', role: '', password: '', confirm_password: '' });
                setIsCreatingUser(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded hover:opacity-90 transition-opacity"
            >
              <Users size={14} /> Add New User
            </button>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-secondary">USER ID</th>
                <th className="px-4 py-3 font-medium text-secondary">USERNAME</th>
                <th className="px-4 py-3 font-medium text-secondary">EMAIL</th>
                <th className="px-4 py-3 font-medium text-secondary">PASSWORD</th>
                <th className="px-4 py-3 font-medium text-secondary">ROLE</th>
                <th className="px-4 py-3 font-medium text-secondary text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 monospace text-accent">
                    <Link to={`/user/${u.id}/analytics`} className="hover:underline flex items-center gap-1" title="View Analytics">
                      <BarChart2 size={12} className="opacity-50" /> {u.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-secondary">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs flex items-center gap-2">
                    {showPasswords[u.id] ? u.password : '••••••••'}
                    <button 
                      onClick={() => {
                        if (showPasswords[u.id]) {
                          setShowPasswords(prev => ({...prev, [u.id]: false}));
                        } else {
                          setPromptPasswordUser(u.id);
                        }
                      }}
                      className="text-secondary hover:text-primary transition-colors focus:outline-none bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded"
                    >
                      {showPasswords[u.id] ? 'Hide' : 'Show'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20 uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => {
                        setEditingUser(u);
                        setEditForm({ id: u.id, username: u.username, email: u.email, role: u.role, new_password: '' });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-semibold rounded transition-colors"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-[32rem] shadow-2xl border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit size={20} /> Edit User Details</h3>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">User ID</label>
                  <input type="text" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none opacity-50 cursor-not-allowed" value={editForm.id} disabled />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Username</label>
                  <input type="text" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Email</label>
                  <input type="email" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Role</label>
                  <input type="text" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Assign New Password (Optional)</label>
                <input 
                  type="password" 
                  placeholder="Leave blank to keep current password..."
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none"
                  value={editForm.new_password}
                  onChange={(e) => setEditForm({...editForm, new_password: e.target.value})}
                  minLength={6}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 text-sm rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white hover:opacity-90 font-semibold">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-[32rem] shadow-2xl border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users size={20} /> 
              {createForm.role === 'manager' ? 'Create New Admin' : 'Create New User'}
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                    {createForm.role === 'manager' ? 'Admin Name' : 'Username'}
                  </label>
                  <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Email ID</label>
                  <input type="email" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Role</label>
                  <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showCreatePassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none pr-10"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      minLength={8}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-2.5 text-secondary hover:text-primary focus:outline-none"
                    >
                      {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showCreateConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none pr-10"
                      value={createForm.confirm_password}
                      onChange={(e) => setCreateForm({...createForm, confirm_password: e.target.value})}
                      minLength={8}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCreateConfirmPassword(!showCreateConfirmPassword)}
                      className="absolute right-3 top-2.5 text-secondary hover:text-primary focus:outline-none"
                    >
                      {showCreateConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-secondary">
                Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
              </p>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 text-sm rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold"
                  onClick={() => setIsCreatingUser(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white hover:opacity-90 font-semibold">
                  {createForm.role === 'manager' ? 'Create Admin' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {promptPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-96 shadow-2xl border border-border">
            <h3 className="text-lg font-bold mb-4">Security Verification</h3>
            <p className="text-sm text-secondary mb-4">Please enter your admin password to reveal this user's password.</p>
            <form onSubmit={handleRevealPassword}>
              <input 
                type="password" 
                placeholder="Admin Password"
                className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none mb-4"
                value={adminPasswordInput}
                onChange={e => setAdminPasswordInput(e.target.value)}
                autoFocus
                required 
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 text-sm rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold"
                  onClick={() => {
                    setPromptPasswordUser(null);
                    setAdminPasswordInput('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white hover:opacity-90 font-semibold">
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

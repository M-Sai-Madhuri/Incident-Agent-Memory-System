import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [loginType, setLoginType] = useState(null); // 'admin' or 'user'
  
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateStrongPassword = (pwd) => {
    if (!pwd) return true;
    if (pwd.length < 8) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await window.fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, username, email, password, role })
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleBack = () => {
    setLoginType(null);
    setError('');
    setUserId('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface p-8 rounded-xl shadow-lg border border-border w-full max-w-md transition-all duration-300">
        
        {!loginType ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-text mb-8">Welcome</h2>
            <button 
              onClick={() => setLoginType('admin')}
              className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              Admin Login
            </button>
            <button 
              onClick={() => setLoginType('user')}
              className="w-full bg-black/5 dark:bg-white/5 text-primary font-bold py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              User Login
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">
                {loginType === 'admin' ? 'Admin Login' : 'User Login'}
              </h2>
              <button 
                onClick={handleBack}
                className="text-sm text-secondary hover:text-primary transition-colors font-medium"
              >
                &larr; Back
              </button>
            </div>
            
            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm border border-red-500/20">{error}</div>}
            
            <form onSubmit={handleLogin} className="space-y-4">
              {loginType === 'admin' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Username</label>
                    <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">User ID</label>
                    <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={userId} onChange={e => setUserId(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Email ID</label>
                    <input type="email" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        autoComplete="new-password"
                        className="w-full bg-background border border-border rounded p-2 pr-10 text-text focus:outline-none focus:border-accent" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                      <button 
                        type="button" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className={`text-[10px] mt-1 ${password && !validateStrongPassword(password) ? 'text-red-500 font-semibold' : 'text-text-dim'}`}>
                      Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Role</label>
                    <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={role} onChange={e => setRole(e.target.value)} required />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">User ID</label>
                    <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={userId} onChange={e => setUserId(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Username</label>
                    <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Email ID</label>
                    <input type="email" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        autoComplete="new-password"
                        className="w-full bg-background border border-border rounded p-2 pr-10 text-text focus:outline-none focus:border-accent" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                      <button 
                        type="button" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className={`text-[10px] mt-1 ${password && !validateStrongPassword(password) ? 'text-red-500 font-semibold' : 'text-text-dim'}`}>
                      Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-1">Role</label>
                    <input type="text" autoComplete="off" className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-accent" value={role} onChange={e => setRole(e.target.value)} required />
                  </div>
                </>
              )}
              <button type="submit" className="w-full bg-accent text-background font-bold py-2 mt-2 rounded hover:opacity-90 transition-opacity">
                Enter Dashboard
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

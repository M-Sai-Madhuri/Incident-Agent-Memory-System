import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, TriangleAlert, Brain, BookOpen, FileText, Settings, Moon, Sun, PlusCircle, User, LogOut, Key, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-accent/10 text-accent' 
          : 'text-secondary hover:text-primary hover:bg-black/5'
      }`
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export function Layout() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showBrainMenu, setShowBrainMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ id: '', username: '', email: '', role: '', current_password: '', new_password: '', confirm_password: '' });

  const validateStrongPassword = (pwd) => {
    if (!pwd) return true; // empty password is ok if not changing
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain at least one special character.";
    return null;
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    window.fetch('http://localhost:8000/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (!data.detail) setUser(data);
      });
  }, []);

  const handleLogout = async () => {
    await window.fetch('http://localhost:8000/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleChangePasswordOnly = async (e) => {
    e.preventDefault();
    if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
      return alert("New Password and Confirm Password do not match.");
    }
    if (changePasswordForm.new_password === changePasswordForm.current_password) {
      return alert("New password cannot be the same as the current password.");
    }
    const pwdError = validateStrongPassword(changePasswordForm.new_password);
    if (pwdError) return alert(pwdError);
    
    const verifyRes = await window.fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, username: user.username, email: user.email, password: changePasswordForm.current_password, role: user.role })
    });
    if (!verifyRes.ok) return alert("Current password is incorrect.");
    
    const res = await window.fetch('http://localhost:8000/api/users/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: changePasswordForm.new_password })
    });
    if (res.ok) {
      alert("Password updated successfully");
      setShowChangePasswordModal(false);
      setChangePasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } else {
      alert("Error updating password");
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (editProfileForm.new_password) {
      if (!editProfileForm.current_password) {
        return alert("You must provide your current password to change it.");
      }
      if (editProfileForm.new_password !== editProfileForm.confirm_password) {
        return alert("New Password and Confirm Password do not match.");
      }
      if (editProfileForm.new_password === editProfileForm.current_password) {
        return alert("New password cannot be the same as the current password.");
      }
      const pwdError = validateStrongPassword(editProfileForm.new_password);
      if (pwdError) return alert(pwdError);
      
      // Verify current password via login endpoint first
      const verifyRes = await window.fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, username: user.username, email: user.email, password: editProfileForm.current_password, role: user.role })
      });
      if (!verifyRes.ok) return alert("Current password is incorrect.");
    }
    
    const res = await window.fetch(`http://localhost:8000/api/users/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editProfileForm)
    });
    if (res.ok) {
      alert("Profile updated successfully");
      setIsEditingProfile(false);
      setShowPasswordModal(false);
      // Reload user data
      window.location.reload();
    } else {
      const data = await res.json();
      alert("Error: " + data.detail);
    }
  };

  return (
    <div className="flex h-screen bg-background text-primary overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 bg-surface border-r border-border flex flex-col shadow-sm shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="text-accent" />
              <span className="font-bold text-sm tracking-tight text-primary">Incident Memory Copilot</span>
            </div>
            <ChevronLeft 
              size={18} 
              className="text-secondary cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            <div>
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
            </div>
            
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider">Incidents</div>
              <SidebarItem to="/active" icon={TriangleAlert} label="Active Incident" />
            </div>

            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider">Memory</div>
              <SidebarItem to="/explorer" icon={Brain} label="Memory Explorer" />
              <SidebarItem to="/history" icon={FileText} label="Learning History" />
              <SidebarItem to="/add-memory" icon={PlusCircle} label="Contribute Memory" />
            </div>
            
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider">Knowledge</div>
              <SidebarItem to="/runbooks" icon={BookOpen} label="Runbooks" />
              <SidebarItem to="/postmortems" icon={FileText} label="Postmortems" />
            </div>
            
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider">System</div>
              <SidebarItem to="/status" icon={Settings} label="Hindsight Status" />
            </div>
          </div>

          <div className="p-4 border-t border-border bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-xs font-medium text-secondary">Hindsight Connected</span>
            </div>
            <div className="text-[11px] text-gray-500 monospace">Bank: incident-response</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shadow-sm z-10 relative shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <ChevronRight 
                size={20} 
                className="text-secondary cursor-pointer hover:text-primary transition-colors mr-2"
                onClick={() => setIsSidebarOpen(true)}
              />
            )}
            <div className="text-sm font-medium text-secondary">Copilot Console</div>
          </div>
          <div className="flex items-center gap-3 relative">
            <div 
              className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold cursor-pointer hover:bg-accent/30 uppercase"
              onClick={() => setShowProfile(!showProfile)}
            >
              {user ? user.username.charAt(0) : 'U'}
            </div>
            
            {showProfile && (
              <div className="absolute top-10 right-0 w-48 bg-surface border border-border rounded-lg shadow-xl py-2 z-50">
                <div 
                  className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm mt-1"
                  onClick={() => { setShowPasswordModal(true); setShowProfile(false); }}
                >
                  <User size={16} /> Profile
                </div>
                
                <div 
                  className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm"
                  onClick={() => { setShowChangePasswordModal(true); setShowProfile(false); }}
                >
                  <Key size={16} /> Change Password
                </div>
                
                <div 
                  className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm"
                  onClick={() => { setIsDark(!isDark); setShowProfile(false); }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? 'Light Mode' : 'Dark Mode'}
                </div>
                
                <div className="border-t border-border mt-2"></div>
                <div 
                  className="px-4 py-2 hover:bg-red-500/10 text-red-500 cursor-pointer flex items-center gap-2 text-sm mt-1"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Logout
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-96 shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <User size={20} /> 
                {user?.role === 'manager' ? 'Admin Profile' : 'User Profile'}
              </h3>
              {user?.role === 'manager' && !isEditingProfile && (
                <button 
                  onClick={() => {
                    setIsEditingProfile(true);
                    setEditProfileForm({ id: user.id, username: user.username, email: user.email, role: user.role, current_password: '', new_password: '', confirm_password: '' });
                  }}
                  className="text-xs font-semibold bg-accent/10 text-accent px-2 py-1 rounded hover:bg-accent/20"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {isEditingProfile ? (
              <form onSubmit={handleEditProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">User ID</label>
                    <input type="text" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editProfileForm.id} onChange={e => setEditProfileForm({...editProfileForm, id: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Username</label>
                    <input type="text" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editProfileForm.username} onChange={e => setEditProfileForm({...editProfileForm, username: e.target.value})} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Email</label>
                    <input type="email" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editProfileForm.email} onChange={e => setEditProfileForm({...editProfileForm, email: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Role</label>
                    <input type="text" className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none" value={editProfileForm.role} onChange={e => setEditProfileForm({...editProfileForm, role: e.target.value})} required />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-bold text-primary mb-3">Change Password (Optional)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Current Password</label>
                      <input 
                        type="password" 
                        placeholder="Required if changing password"
                        className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none"
                        value={editProfileForm.current_password}
                        onChange={(e) => setEditProfileForm({...editProfileForm, current_password: e.target.value})}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">New Password</label>
                        <input 
                          type="password" 
                          placeholder="New strong password"
                          className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none"
                          value={editProfileForm.new_password}
                          onChange={(e) => setEditProfileForm({...editProfileForm, new_password: e.target.value})}
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Confirm Password</label>
                        <input 
                          type="password" 
                          placeholder="Must match new password"
                          className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none"
                          value={editProfileForm.confirm_password}
                          onChange={(e) => setEditProfileForm({...editProfileForm, confirm_password: e.target.value})}
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-secondary">
                      Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                  <button 
                    type="button" 
                    className="px-4 py-2 text-sm rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white hover:opacity-90 font-semibold">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">User ID</label>
                <div className="text-primary font-medium text-sm">{user?.id}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Username</label>
                <div className="text-primary font-medium text-sm">{user?.username}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Email</label>
                <div className="text-primary font-medium text-sm truncate">{user?.email}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Role</label>
                <div className="text-primary font-medium text-sm uppercase">{user?.role}</div>
              </div>
            </div>


              <div className="flex justify-end pt-4 border-t border-border">
                <button 
                  type="button" 
                  className="px-4 py-2 text-sm rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setIsEditingProfile(false);
                  }}
                >
                  Close
                </button>
              </div>
            </>
            )}
          </div>
        </div>
      )}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-96 shadow-2xl border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Key size={20} /> Change Password
            </h3>
            
            <form onSubmit={handleChangePasswordOnly} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPwd ? "text" : "password"} 
                    placeholder="Required"
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none pr-10"
                    value={changePasswordForm.current_password}
                    onChange={(e) => setChangePasswordForm({...changePasswordForm, current_password: e.target.value})}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-2.5 text-secondary hover:text-primary focus:outline-none"
                  >
                    {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPwd ? "text" : "password"} 
                    placeholder="New strong password"
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none pr-10"
                    value={changePasswordForm.new_password}
                    onChange={(e) => setChangePasswordForm({...changePasswordForm, new_password: e.target.value})}
                    required
                    minLength={8}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-2.5 text-secondary hover:text-primary focus:outline-none"
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPwd ? "text" : "password"} 
                    placeholder="Must match new password"
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:border-accent outline-none pr-10"
                    value={changePasswordForm.confirm_password}
                    onChange={(e) => setChangePasswordForm({...changePasswordForm, confirm_password: e.target.value})}
                    required
                    minLength={8}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-2.5 text-secondary hover:text-primary focus:outline-none"
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-secondary">
                Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
              </p>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 text-sm rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-semibold"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                    setShowCurrentPwd(false);
                    setShowNewPwd(false);
                    setShowConfirmPwd(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white hover:opacity-90 font-semibold">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

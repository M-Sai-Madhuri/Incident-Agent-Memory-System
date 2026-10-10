import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LabelList } from 'recharts';

export function UserAnalytics() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/${id}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-secondary animate-pulse">Loading analytics...</div>;
  }

  if (!user || user.detail === "User not found") {
    return (
      <div className="p-8">
        <Link to="/" className="text-accent hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="text-error font-bold">User not found.</div>
      </div>
    );
  }

  const stats = user.stats || { searched: 0, approved: 0, declined: 0, postmortems: 0, runbooks: 0 };

  const radarData = [
    { subject: 'Searched', A: stats.searched, fullMark: Math.max(10, stats.searched * 1.5) },
    { subject: 'Approved', A: stats.approved, fullMark: Math.max(10, stats.approved * 1.5) },
    { subject: 'Declined', A: stats.declined, fullMark: Math.max(10, stats.declined * 1.5) },
    { subject: 'Postmortems', A: stats.postmortems, fullMark: Math.max(10, stats.postmortems * 1.5) },
  ];

  const totalAccuracy = stats.approved + stats.declined;
  const pieData = totalAccuracy > 0 
    ? [
        { name: 'Approved', value: stats.approved },
        { name: 'Declined', value: stats.declined }
      ]
    : [
        { name: 'No Data', value: 1 }
      ];
      
  const pieColors = totalAccuracy > 0 
    ? ['#22c55e', '#ef4444'] 
    : ['#e5e7eb']; // light grey for no data

  const barData = [
    { name: 'Postmortems', count: stats.postmortems }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="bg-gradient-to-r from-accent/10 via-purple-500/10 to-indigo-500/10 border border-accent/20 rounded-xl p-8 flex items-center gap-6 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold shadow-md">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-1">{user.username} - Performance Analytics</h1>
          <div className="flex items-center gap-4 text-sm text-secondary">
            <span className="flex items-center gap-1"><User size={14} /> {user.role.toUpperCase()}</span>
            <span>•</span>
            <span className="monospace text-accent font-medium">{user.id}</span>
            <span>•</span>
            <span>{user.email}</span>
          </div>
        </div>
      </div>

      {/* Stats Summary Line */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-4 rounded-lg text-center shadow-sm">
          <div className="text-xs font-bold text-secondary uppercase mb-1">Total Searched</div>
          <div className="text-2xl font-bold text-primary">{stats.searched}</div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-lg text-center shadow-sm">
          <div className="text-xs font-bold text-secondary uppercase mb-1">Approved</div>
          <div className="text-2xl font-bold text-success">{stats.approved}</div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-lg text-center shadow-sm">
          <div className="text-xs font-bold text-secondary uppercase mb-1">Declined</div>
          <div className="text-2xl font-bold text-error">{stats.declined}</div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-lg text-center shadow-sm">
          <div className="text-xs font-bold text-secondary uppercase mb-1">Postmortems</div>
          <div className="text-2xl font-bold text-purple-500">{stats.postmortems}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Radar Chart */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col h-96">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Activity Balance</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#667085', fontSize: 12}} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name={user.username} dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col h-96">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Investigation Accuracy</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                {totalAccuracy > 0 && <Tooltip />}
                <Legend verticalAlign="bottom" height={36} payload={
                  totalAccuracy > 0 ? undefined : [
                    { value: 'Approved', type: 'rect', color: '#22c55e' },
                    { value: 'Declined', type: 'rect', color: '#ef4444' }
                  ]
                } />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-secondary mt-2">Ratio of accepted vs rejected action plans</div>
        </div>

        {/* Bar Chart */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col h-96">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Knowledge Contribution</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{fill: '#667085', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#667085', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={10}>
                  {
                    barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#a855f7' : '#eab308'} />
                    ))
                  }
                  <LabelList dataKey="count" position="top" fill="#667085" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

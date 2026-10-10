import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { ActiveIncident } from './pages/ActiveIncident';
import { MemoryExplorer } from './pages/MemoryExplorer';
import { LearningHistory } from './pages/LearningHistory';
import { Runbooks } from './pages/Runbooks';
import { Postmortems } from './pages/Postmortems';
import { AddPostmortem } from './pages/AddPostmortem';
import { Status } from './pages/Status';
import { Login } from './pages/Login';
import { UserAnalytics } from './pages/UserAnalytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="active" element={<ActiveIncident />} />
          <Route path="explorer" element={<MemoryExplorer />} />
          <Route path="history" element={<LearningHistory />} />
          <Route path="runbooks" element={<Runbooks />} />
          <Route path="postmortems" element={<Postmortems />} />
          <Route path="add-memory" element={<AddPostmortem />} />
          <Route path="status" element={<Status />} />
          <Route path="user/:id/analytics" element={<UserAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global fetch interceptor to attach credentials and handle 401s
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) {
    config = {};
  }
  // Always include credentials (cookies) for API requests
  config.credentials = 'include';
  
  const response = await originalFetch(resource, config);
  
  // If unauthorized and not already on the login page or trying to login
  if (response.status === 401 && !resource.includes('/api/login')) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('app') || document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

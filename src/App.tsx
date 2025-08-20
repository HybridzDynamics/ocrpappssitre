import React from 'react';
import { useState } from 'react';
import ApplicationForm from './components/ApplicationForm';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/LoginForm';
import { authService } from './lib/auth';

function App() {
  const [currentView, setCurrentView] = useState<'application' | 'admin'>('application');
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentView('application');
  };

  // If trying to access admin but not authenticated, show login
  if (currentView === 'admin' && !isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      {/* Navigation */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('application')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'application'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Application
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {isAuthenticated ? 'Admin Panel' : 'Admin Login'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentView === 'application' ? (
        <ApplicationForm />
      ) : (
        <AdminPanel onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
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
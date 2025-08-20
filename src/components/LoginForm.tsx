import React, { useState } from 'react';
import { Lock, User, AlertCircle, Shield } from 'lucide-react';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

// Hardcoded admin users
const ADMIN_USERS = {
  'hybridz': 'admin_ocrp_DAF',
  'rhys': 'admin_ocrp_F'
};

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const authenticateUser = (username: string, password: string): boolean => {
    return ADMIN_USERS[username] === password;
  };

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (authenticateUser(credentials.username, credentials.password)) {
        setIsLoggedIn(true);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Login Successful!</h1>
            <p className="text-slate-300">Welcome to the admin panel</p>
            <p className="text-green-300 mt-4">Logged in as: {credentials.username}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-slate-300">Orlando City Roleplay</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
              } text-white`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-slate-400 text-sm">
              Authorized personnel only
            </p>
            <div className="mt-2 text-xs text-slate-500">
              <p>Test users: hybridz, rhys</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
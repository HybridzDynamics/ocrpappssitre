import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  Filter,
  Search,
  Calendar,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { supabase, type Application } from '../lib/supabase';
import { authService } from '../lib/auth';
import UserManagement from './UserManagement';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentView, setCurrentView] = useState<'applications' | 'users'>('applications');

  const currentUser = authService.getCurrentUser();

  const questions = [
    "Why do you want to be staff?",
    "What are the key responsibilities within staff?",
    "What is RDM?",
    "What is FRP?",
    "What is Meta Gaming?",
    "Why should we choose you over others?",
    "What will you bring to the team?",
    "Will you meet the quota of 2 hours per week and 200 messages in main chat?",
    "Do you agree these are your own answers?",
    "Any questions for us?"
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected') => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          notes: reviewNotes || null
        })
        .eq('id', id);

      if (error) throw error;

      await fetchApplications();
      setSelectedApp(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = app.discord_username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-slate-300">Orlando City Roleplay Staff Applications</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('applications')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'applications'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Applications
                </button>
                {authService.hasRole('super_admin') && (
                  <button
                    onClick={() => setCurrentView('users')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentView === 'users'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Users
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Welcome, {currentUser?.username}</p>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'applications' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">Approved</p>
                    <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">Rejected</p>
                    <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-slate-300" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="w-5 h-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search by Discord username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/20">
                    <tr>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Applicant</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Applied</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-8 h-8 text-slate-400" />
                            <div>
                              <p className="text-white font-medium">{app.discord_username}</p>
                              <p className="text-slate-400 text-sm">ID: {app.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            <span className="capitalize">{app.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 text-lg">No applications found</p>
                  <p className="text-slate-400">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <UserManagement />
        )}
      </div>

      {/* Application Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Application Review</h2>
                  <p className="text-slate-300">{selectedApp.discord_username}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Applied</p>
                  <p className="text-white">{new Date(selectedApp.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Current Status</p>
                  <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApp.status)}`}>
                    {getStatusIcon(selectedApp.status)}
                    <span className="capitalize">{selectedApp.status}</span>
                  </span>
                </div>
              </div>

              {/* Questions and Answers */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Application Responses</h3>
                {questions.map((question, index) => (
                  <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-300 font-medium mb-2">{index + 1}. {question}</p>
                    <p className="text-white">{selectedApp.answers[index] || 'No answer provided'}</p>
                  </div>
                ))}
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Action Buttons */}
              {selectedApp.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, 'approved')}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{isUpdating ? 'Updating...' : 'Approve'}</span>
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, 'rejected')}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>{isUpdating ? 'Updating...' : 'Reject'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
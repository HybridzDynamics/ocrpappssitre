import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  MessageSquare,
  Tag,
  User,
  Shield,
  History,
  Bell,
  Download,
  FileText as FileIcon,
  Printer,
  Mail,
  Cog
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import ApplicationAnalytics from './ApplicationAnalytics';
import BulkActions from './BulkActions';
import ApplicationComments from './ApplicationComments';
import NotificationCenter from './NotificationCenter';
import AuditLog from './AuditLog';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import EmailTemplates from './EmailTemplates';
import type { Application, ApplicationStats } from '../lib/types';
import { DEPARTMENTS } from '../lib/types';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'applications' | 'analytics' | 'users' | 'audit' | 'settings' | 'templates'>('applications');
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    priority: 'all',
    search: '',
    dateRange: 'all'
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

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

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_application_stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(app => app.department === filters.department);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(app => app.priority === filters.priority);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.discord_username.toLowerCase().includes(searchLower) ||
        app.applicant_email?.toLowerCase().includes(searchLower) ||
        app.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let dateThreshold = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          dateThreshold.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateThreshold.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(app => new Date(app.created_at) >= dateThreshold);
    }

    setFilteredApplications(filtered);
  };

  const handleStatusUpdate = async (applicationId: string, status: string, reason?: string) => {
    try {
      const updateData: any = {
        status,
        reviewed_by: currentUser?.id,
        reviewed_at: new Date().toISOString()
      };

      if (reason) {
        updateData.final_decision_reason = reason;
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      await fetchApplications();
      await fetchStats();
      
      // Close the detailed view if the updated application was selected
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    }
  };

  const handleBulkSelection = (applicationId: string, selected: boolean) => {
    if (selected) {
      setSelectedApplications([...selectedApplications, applicationId]);
    } else {
      setSelectedApplications(selectedApplications.filter(id => id !== applicationId));
    }
  };

  const exportApplications = () => {
    const csvContent = [
      ['Discord Username', 'Department', 'Status', 'Priority', 'Applied Date', 'Email', 'Age'].join(','),
      ...filteredApplications.map(app => [
        app.discord_username,
        getDepartmentInfo(app.department).name,
        app.status,
        app.priority,
        new Date(app.created_at).toLocaleDateString(),
        app.applicant_email || '',
        app.applicant_age || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocrp-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printApplications = () => {
    const printContent = `
      <html>
        <head>
          <title>Orlando City Roleplay - Applications Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orlando City Roleplay</h1>
            <h2>Applications Report</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Discord Username</th>
                <th>Department</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredApplications.map(app => `
                <tr>
                  <td>${app.discord_username}</td>
                  <td>${getDepartmentInfo(app.department).name}</td>
                  <td>${app.status}</td>
                  <td>${app.priority}</td>
                  <td>${new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const sendBulkEmail = async () => {
    const emails = filteredApplications
      .filter(app => app.applicant_email)
      .map(app => app.applicant_email)
      .join(',');
    
    if (emails) {
      window.open(`mailto:${emails}?subject=Orlando City Roleplay - Application Update`);
    } else {
      alert('No email addresses found in selected applications.');
    }
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'under_review': return 'text-yellow-400 bg-yellow-400/20';
      case 'interview_scheduled': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'normal': return 'text-blue-400 bg-blue-400/20';
      case 'low': return 'text-slate-400 bg-slate-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getDepartmentInfo = (departmentId: string) => {
    return DEPARTMENTS.find(d => d.id === departmentId) || {
      name: departmentId.toUpperCase(),
      fullName: departmentId
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Orlando City Roleplay</h1>
                <p className="text-slate-300">Admin Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              
              <div className="flex items-center space-x-3 text-white">
                <User className="w-5 h-5" />
                <span>{currentUser?.username}</span>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                  {currentUser?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('applications')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'applications'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Applications</span>
            </button>
            
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            
            <button
              onClick={() => setCurrentView('users')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </button>
            
            <button
              onClick={() => setCurrentView('audit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'audit'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log</span>
            </button>
            
            <button
              onClick={() => setCurrentView('templates')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Templates</span>
            </button>
            
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Cog className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {currentView === 'applications' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">Total Applications</p>
                      <p className="text-3xl font-bold text-white">{stats.total}</p>
                    </div>
                    <FileText className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">Pending Review</p>
                      <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-400" />
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">Approved</p>
                      <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">High Priority</p>
                      <p className="text-3xl font-bold text-red-400">{stats.high_priority + stats.urgent_priority}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            <BulkActions
              selectedApplications={selectedApplications}
              onActionComplete={() => {
                fetchApplications();
                fetchStats();
              }}
              onClearSelection={() => setSelectedApplications([])}
            />

            {/* Export and Actions Bar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">
                    {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportApplications}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  
                  <button
                    onClick={printApplications}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  
                  <button
                    onClick={sendBulkEmail}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email All</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Departments</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Search applications..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/20">
                    <tr>
                      <th className="text-left px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-400"
                        />
                      </th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Applicant</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Department</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Priority</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Applied</th>
                      <th className="text-left px-6 py-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((application) => {
                      const deptInfo = getDepartmentInfo(application.department);
                      
                      return (
                        <tr key={application.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedApplications.includes(application.id)}
                              onChange={(e) => handleBulkSelection(application.id, e.target.checked)}
                              className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-400"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{application.discord_username}</p>
                              {application.applicant_email && (
                                <p className="text-slate-400 text-sm">{application.applicant_email}</p>
                              )}
                              {application.applicant_age && (
                                <p className="text-slate-400 text-sm">Age: {application.applicant_age}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                              {deptInfo.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
                              {application.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {new Date(application.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedApplication(application)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(application.id, 'approved')}
                                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredApplications.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-300 text-lg">No applications found</p>
                    <p className="text-slate-400">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && <ApplicationAnalytics />}
        {currentView === 'users' && <UserManagement />}
        {currentView === 'audit' && <AuditLog />}
        {currentView === 'templates' && <EmailTemplates />}
        {currentView === 'settings' && <SystemSettings />}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Application Details</h2>
                    <p className="text-slate-300">
                      {getDepartmentInfo(selectedApplication.department).fullName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Application Info */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Applicant Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm">Discord Username</p>
                          <p className="text-white font-medium">{selectedApplication.discord_username}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Department</p>
                          <p className="text-white font-medium">
                            {getDepartmentInfo(selectedApplication.department).fullName}
                          </p>
                        </div>
                        {selectedApplication.applicant_email && (
                          <div>
                            <p className="text-slate-400 text-sm">Email</p>
                            <p className="text-white font-medium">{selectedApplication.applicant_email}</p>
                          </div>
                        )}
                        {selectedApplication.applicant_age && (
                          <div>
                            <p className="text-slate-400 text-sm">Age</p>
                            <p className="text-white font-medium">{selectedApplication.applicant_age}</p>
                          </div>
                        )}
                        {selectedApplication.timezone && (
                          <div>
                            <p className="text-slate-400 text-sm">Timezone</p>
                            <p className="text-white font-medium">{selectedApplication.timezone}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-400 text-sm">Applied</p>
                          <p className="text-white font-medium">
                            {new Date(selectedApplication.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Availability & Experience */}
                    {(selectedApplication.availability || selectedApplication.previous_experience) && (
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                        {selectedApplication.availability && (
                          <div className="mb-4">
                            <p className="text-slate-400 text-sm mb-2">Availability</p>
                            <p className="text-white">{selectedApplication.availability}</p>
                          </div>
                        )}
                        {selectedApplication.previous_experience && (
                          <div>
                            <p className="text-slate-400 text-sm mb-2">Previous Experience</p>
                            <p className="text-white">{selectedApplication.previous_experience}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Questions & Answers */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Application Responses</h3>
                      <div className="space-y-4">
                        {selectedApplication.answers.map((answer, index) => (
                          <div key={index}>
                            <p className="text-slate-400 text-sm mb-2">Question {index + 1}</p>
                            <p className="text-white bg-slate-600/50 rounded p-3">{answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comments */}
                    <ApplicationComments applicationId={selectedApplication.id} />
                  </div>

                  {/* Actions Sidebar */}
                  <div className="space-y-6">
                    {/* Status & Priority */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Status & Priority</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Current Status</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                            {selectedApplication.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Priority</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedApplication.priority)}`}>
                            {selectedApplication.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                      <div className="space-y-2">
                        {selectedApplication.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(selectedApplication.id, 'under_review')}
                              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                            >
                              Mark Under Review
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedApplication.id, 'interview_scheduled')}
                              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                              Schedule Interview
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                              Approve Application
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              Reject Application
                            </button>
                          </>
                        )}
                        
                        {selectedApplication.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedApplication.id, 'pending')}
                            className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review Information */}
                    {selectedApplication.reviewed_at && (
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Review Information</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-slate-400 text-sm">Reviewed At</p>
                            <p className="text-white text-sm">
                              {new Date(selectedApplication.reviewed_at).toLocaleString()}
                            </p>
                          </div>
                          {selectedApplication.final_decision_reason && (
                            <div>
                              <p className="text-slate-400 text-sm">Decision Reason</p>
                              <p className="text-white text-sm">{selectedApplication.final_decision_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  AlertTriangle,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ApplicationStats } from '../lib/types';

const ApplicationAnalytics = () => {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Get overall stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_application_stats');

      if (statsError) throw statsError;
      setStats(statsData);

      // Get weekly application data
      const daysBack = parseInt(timeRange);
      const { data: weeklyApplications, error: weeklyError } = await supabase
        .from('applications')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (weeklyError) throw weeklyError;

      // Process weekly data
      const weeklyMap = new Map();
      const lastDays = Array.from({ length: Math.min(daysBack, 14) }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      lastDays.forEach(date => weeklyMap.set(date, 0));

      weeklyApplications?.forEach(app => {
        const date = new Date(app.created_at).toISOString().split('T')[0];
        if (weeklyMap.has(date)) {
          weeklyMap.set(date, weeklyMap.get(date) + 1);
        }
      });

      const weeklyChartData = Array.from(weeklyMap.entries()).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        applications: count
      }));

      setWeeklyData(weeklyChartData);

      // Get status distribution
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('status, department')
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (appsError) throw appsError;

      // Process status data
      const statusMap = new Map();
      applications?.forEach(app => {
        statusMap.set(app.status, (statusMap.get(app.status) || 0) + 1);
      });

      const statusChartData = Array.from(statusMap.entries()).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: getStatusColor(status)
      }));

      setStatusData(statusChartData);

      // Process department data
      const deptMap = new Map();
      applications?.forEach(app => {
        deptMap.set(app.department, (deptMap.get(app.department) || 0) + 1);
      });

      const deptChartData = Array.from(deptMap.entries()).map(([dept, count]) => ({
        name: dept.toUpperCase(),
        applications: count,
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));

      setDepartmentData(deptChartData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'under_review': return '#F59E0B';
      case 'interview_scheduled': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const exportAnalytics = () => {
    const analyticsData = {
      stats,
      weeklyData,
      statusData,
      departmentData,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocrp-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-slate-300">Application insights and trends</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">Total Applications</p>
              <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-green-400 text-sm mt-1">
                +{stats?.today_applications || 0} today
              </p>
            </div>
            <Users className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              <p className="text-yellow-400 text-sm mt-1">
                {stats?.high_priority || 0} high priority
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-400">{stats?.approved || 0}</p>
              <p className="text-green-400 text-sm mt-1">
                {stats ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">Interviews</p>
              <p className="text-3xl font-bold text-purple-400">{stats?.interviews_scheduled || 0}</p>
              <p className="text-purple-400 text-sm mt-1">
                Scheduled
              </p>
            </div>
            <Calendar className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Applications Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Applications Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="applications" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Applications by Department</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }} 
            />
            <Bar dataKey="applications" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Application Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {stats?.today_applications || 0}
            </div>
            <div className="text-slate-300">Today</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats?.this_week_applications || 0}
            </div>
            <div className="text-slate-300">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {stats?.this_month_applications || 0}
            </div>
            <div className="text-slate-300">This Month</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationAnalytics;
import React, { useState, useEffect } from 'react';
import { History, User, Calendar, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AuditLog as AuditLogType } from '../lib/types';

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: 'all',
    resource_type: 'all',
    user_id: 'all',
    date_range: '7'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [filter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:admin_users(username, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filter.action !== 'all') {
        query = query.eq('action', filter.action);
      }
      
      if (filter.resource_type !== 'all') {
        query = query.eq('resource_type', filter.resource_type);
      }
      
      if (filter.user_id !== 'all') {
        query = query.eq('user_id', filter.user_id);
      }

      if (filter.date_range !== 'all') {
        const days = parseInt(filter.date_range);
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        query = query.gte('created_at', dateThreshold.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower) ||
      log.user?.username?.toLowerCase().includes(searchLower) ||
      log.resource_id?.toLowerCase().includes(searchLower)
    );
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
      case 'create': return 'text-green-400 bg-green-400/20';
      case 'update':
      case 'modify': return 'text-blue-400 bg-blue-400/20';
      case 'delete':
      case 'remove': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const formatChanges = (oldValues: any, newValues: any) => {
    if (!oldValues || !newValues) return null;

    const changes = [];
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes.push({
          field: key,
          from: oldValues[key],
          to: newValues[key]
        });
      }
    }

    return changes;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Log</h2>
          <p className="text-slate-300">System activity and changes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Action</label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Actions</option>
              <option value="INSERT">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Resource</label>
            <select
              value={filter.resource_type}
              onChange={(e) => setFilter({ ...filter, resource_type: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Resources</option>
              <option value="application">Applications</option>
              <option value="admin_user">Admin Users</option>
              <option value="comment">Comments</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Time Range</label>
            <select
              value={filter.date_range}
              onChange={(e) => setFilter({ ...filter, date_range: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/20">
                <tr>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold">Timestamp</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold">User</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold">Action</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold">Resource</th>
                  <th className="text-left px-6 py-4 text-slate-300 font-semibold">Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const changes = formatChanges(log.old_values, log.new_values);
                  
                  return (
                    <tr key={log.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-white">
                            {log.user?.username || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-xs text-slate-400">
                              ID: {log.resource_id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {changes && changes.length > 0 ? (
                          <div className="space-y-1">
                            {changes.slice(0, 2).map((change, index) => (
                              <div key={index} className="text-xs">
                                <span className="text-slate-400">{change.field}:</span>
                                <span className="text-red-400 mx-1">
                                  {String(change.from).slice(0, 20)}
                                  {String(change.from).length > 20 ? '...' : ''}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-green-400 ml-1">
                                  {String(change.to).slice(0, 20)}
                                  {String(change.to).length > 20 ? '...' : ''}
                                </span>
                              </div>
                            ))}
                            {changes.length > 2 && (
                              <div className="text-xs text-slate-400">
                                +{changes.length - 2} more changes
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">No changes tracked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 text-lg">No audit logs found</p>
                <p className="text-slate-400">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  is_active: boolean;
  created_by?: string;
}

interface NewUser {
  username: string;
  password: string;
  role: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    password: '',
    role: 'admin'
  });

  const currentUser = authService.getCurrentUser();
  const canManageUsers = authService.hasRole('super_admin');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Hash the password
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password: newUser.password });

      if (hashError) throw hashError;

      const { error } = await supabase
        .from('admin_users')
        .insert([
          {
            username: newUser.username,
            password_hash: hashedPassword,
            role: newUser.role,
            created_by: currentUser?.id
          }
        ]);

      if (error) throw error;

      await fetchUsers();
      setShowAddForm(false);
      setNewUser({ username: '', password: '', role: 'admin' });
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user. Username might already exist.');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
        <p className="text-slate-300">You don't have permission to manage users.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <p className="text-slate-300">Manage admin users and permissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Add New User</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-2">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Create User</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/20">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold">User</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold">Role</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold">Status</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold">Created</th>
                <th className="text-left px-6 py-4 text-slate-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-6 h-6 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                        <p className="text-slate-400 text-sm">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'super_admin' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {user.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
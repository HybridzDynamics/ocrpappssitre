import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = authService.getCurrentUser();
  const canManageSettings = authService.hasRole('super_admin');

  useEffect(() => {
    if (canManageSettings) {
      fetchSettings();
    }
  }, [canManageSettings]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: any) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: value,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSettings(prev => 
        prev.map(s => 
          s.setting_key === settingKey 
            ? { ...s, setting_value: value, updated_at: new Date().toISOString() }
            : s
        )
      );
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save all modified settings
      await Promise.all(
        settings.map(setting => 
          supabase
            .from('system_settings')
            .upsert({
              setting_key: setting.setting_key,
              setting_value: setting.setting_value,
              updated_by: currentUser?.id,
              updated_at: new Date().toISOString()
            })
        )
      );

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const defaultSettings = [
    {
      setting_key: 'application_auto_approval',
      setting_value: false,
      description: 'Automatically approve applications that meet certain criteria'
    },
    {
      setting_key: 'max_applications_per_user',
      setting_value: 3,
      description: 'Maximum number of applications a user can submit'
    },
    {
      setting_key: 'application_cooldown_hours',
      setting_value: 24,
      description: 'Hours a user must wait between applications'
    },
    {
      setting_key: 'email_notifications_enabled',
      setting_value: true,
      description: 'Send email notifications for application updates'
    },
    {
      setting_key: 'discord_webhook_enabled',
      setting_value: true,
      description: 'Send notifications to Discord webhook'
    },
    {
      setting_key: 'maintenance_mode',
      setting_value: false,
      description: 'Enable maintenance mode (disables new applications)'
    }
  ];

  if (!canManageSettings) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
        <Settings className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
        <p className="text-slate-300">You don't have permission to manage system settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">System Settings</h2>
            <p className="text-slate-300">Configure application system behavior</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-400/30 text-green-100'
            : 'bg-red-500/20 border border-red-400/30 text-red-100'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="space-y-6">
          {defaultSettings.map((defaultSetting) => {
            const setting = settings.find(s => s.setting_key === defaultSetting.setting_key) || defaultSetting;
            
            return (
              <div key={setting.setting_key} className="border-b border-white/10 pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  
                  {typeof setting.setting_value === 'boolean' ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.setting_value}
                        onChange={(e) => {
                          const newSettings = settings.map(s => 
                            s.setting_key === setting.setting_key 
                              ? { ...s, setting_value: e.target.checked }
                              : s
                          );
                          setSettings(newSettings);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  ) : typeof setting.setting_value === 'number' ? (
                    <input
                      type="number"
                      value={setting.setting_value}
                      onChange={(e) => {
                        const newSettings = settings.map(s => 
                          s.setting_key === setting.setting_key 
                            ? { ...s, setting_value: parseInt(e.target.value) }
                            : s
                        );
                        setSettings(newSettings);
                      }}
                      className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <input
                      type="text"
                      value={setting.setting_value}
                      onChange={(e) => {
                        const newSettings = settings.map(s => 
                          s.setting_key === setting.setting_key 
                            ? { ...s, setting_value: e.target.value }
                            : s
                        );
                        setSettings(newSettings);
                      }}
                      className="w-64 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  )}
                </div>
                
                {setting.description && (
                  <p className="text-slate-400 text-sm">{setting.description}</p>
                )}
                
                {setting.updated_at && (
                  <p className="text-slate-500 text-xs mt-2">
                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
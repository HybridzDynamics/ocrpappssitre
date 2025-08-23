import React, { useState, useEffect } from 'react';
import { Mail, Plus, Edit, Trash2, Save, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>({});

  const currentUser = authService.getCurrentUser();
  const canManageTemplates = authService.hasRole('super_admin') || authService.hasRole('admin');

  useEffect(() => {
    if (canManageTemplates) {
      fetchTemplates();
    }
  }, [canManageTemplates]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      if (template.id) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: template.name,
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            is_active: template.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([{
            name: template.name,
            subject: template.subject,
            body: template.body,
            variables: template.variables || [],
            is_active: template.is_active ?? true
          }]);

        if (error) throw error;
      }

      await fetchTemplates();
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const renderPreview = (template: EmailTemplate) => {
    let subject = template.subject;
    let body = template.body;

    // Replace variables with sample data
    const sampleData = {
      applicant_name: 'John Doe',
      department: 'Orlando City Police Department',
      status: 'approved',
      application_date: new Date().toLocaleDateString(),
      reviewer_name: 'Admin User'
    };

    template.variables.forEach(variable => {
      const value = sampleData[variable as keyof typeof sampleData] || `{${variable}}`;
      subject = subject.replace(new RegExp(`{${variable}}`, 'g'), value);
      body = body.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    return { subject, body };
  };

  const defaultTemplates = [
    {
      name: 'Application Received',
      subject: 'Application Received - {department}',
      body: `Dear {applicant_name},

Thank you for your interest in joining {department}. We have received your application and it is currently under review.

Application Details:
- Department: {department}
- Submitted: {application_date}
- Status: Pending Review

Our team will review your application and get back to you within 3-5 business days. If you have any questions, please don't hesitate to contact us.

Best regards,
Orlando City Roleplay Management Team`,
      variables: ['applicant_name', 'department', 'application_date'],
      is_active: true
    },
    {
      name: 'Application Approved',
      subject: 'Congratulations! Your application has been approved',
      body: `Dear {applicant_name},

Congratulations! We are pleased to inform you that your application to join {department} has been approved.

Next Steps:
1. Join our Discord server if you haven't already
2. Attend the next orientation session
3. Complete your training requirements

Welcome to the Orlando City Roleplay family!

Best regards,
{reviewer_name}
{department} Management`,
      variables: ['applicant_name', 'department', 'reviewer_name'],
      is_active: true
    },
    {
      name: 'Application Rejected',
      subject: 'Application Update - {department}',
      body: `Dear {applicant_name},

Thank you for your interest in joining {department}. After careful review, we have decided not to move forward with your application at this time.

This decision was not made lightly, and we encourage you to reapply in the future after gaining more experience or addressing any concerns mentioned during the review process.

If you have any questions about this decision, please feel free to contact us.

Best regards,
{reviewer_name}
{department} Management`,
      variables: ['applicant_name', 'department', 'reviewer_name'],
      is_active: true
    }
  ];

  if (!canManageTemplates) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
        <Mail className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
        <p className="text-slate-300">You don't have permission to manage email templates.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Email Templates</h2>
            <p className="text-slate-300">Manage automated email templates</p>
          </div>
        </div>
        
        <button
          onClick={() => setEditingTemplate({
            id: '',
            name: '',
            subject: '',
            body: '',
            variables: [],
            is_active: true,
            created_at: '',
            updated_at: ''
          })}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">No email templates found</p>
            <p className="text-slate-400">Create your first template to get started</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  <p className="text-slate-400 text-sm">{template.subject}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.is_active 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-slate-300 text-sm line-clamp-3">{template.body}</p>
              </div>
              
              {template.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span key={variable} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setPreviewData(renderPreview(template));
                    setShowPreview(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {editingTemplate.id ? 'Edit Template' : 'New Template'}
                </h3>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="e.g., Application Approved"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingTemplate.is_active}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-400"
                      />
                      <span className="text-slate-300">Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g., Congratulations! Your application has been approved"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">Email Body</label>
                  <textarea
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter the email content here..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">Variables (comma-separated)</label>
                  <input
                    type="text"
                    value={editingTemplate.variables.join(', ')}
                    onChange={(e) => setEditingTemplate({ 
                      ...editingTemplate, 
                      variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g., applicant_name, department, status"
                  />
                  <p className="text-slate-400 text-sm mt-1">
                    Use variables like {'{applicant_name}'} in your template
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => saveTemplate(editingTemplate)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Template</span>
                  </button>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-white rounded-lg p-6 text-gray-900">
                <div className="border-b pb-4 mb-4">
                  <h4 className="font-semibold">Subject: {previewData.subject}</h4>
                </div>
                <div className="whitespace-pre-wrap">{previewData.body}</div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { ApplicationComment } from '../lib/types';

interface ApplicationCommentsProps {
  applicationId: string;
}

const ApplicationComments: React.FC<ApplicationCommentsProps> = ({ applicationId }) => {
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchComments();
  }, [applicationId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('application_comments')
        .select(`
          *,
          admin:admin_users(username, role)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('application_comments')
        .insert([
          {
            application_id: applicationId,
            admin_id: currentUser.id,
            comment: newComment.trim(),
            is_internal: isInternal
          }
        ]);

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('application_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h4 className="text-lg font-semibold text-white">Comments & Notes</h4>
        <span className="text-slate-400 text-sm">({comments.length})</span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.is_internal
                  ? 'bg-slate-700/50 border-slate-600'
                  : 'bg-blue-900/30 border-blue-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white">
                    {comment.admin?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-1">
                    {comment.is_internal ? (
                      <EyeOff className="w-3 h-3 text-slate-400" />
                    ) : (
                      <Eye className="w-3 h-3 text-blue-400" />
                    )}
                    <span className="text-xs text-slate-400">
                      {comment.is_internal ? 'Internal' : 'Public'}
                    </span>
                  </div>
                </div>
                {comment.admin_id === currentUser?.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-slate-200 text-sm">{comment.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or note..."
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        />
        
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-400"
            />
            <span className="text-sm text-slate-300">Internal comment</span>
          </label>
          
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Adding...' : 'Add Comment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationComments;
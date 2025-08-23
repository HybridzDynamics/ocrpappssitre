import React, { useState } from 'react';
import { 
  CheckSquare, 
  XSquare, 
  Tag, 
  AlertTriangle, 
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BulkAction } from '../lib/types';

interface BulkActionsProps {
  selectedApplications: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedApplications,
  onActionComplete,
  onClearSelection
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkAction | null>(null);
  const [reason, setReason] = useState('');
  const [tagValue, setTagValue] = useState('');
  const [priority, setPriority] = useState('normal');
  const [newStatus, setNewStatus] = useState('under_review');
  const [interviewDate, setInterviewDate] = useState('');

  const handleBulkAction = async (action: BulkAction) => {
    if (action.action === 'approve' || action.action === 'reject') {
      setCurrentAction(action);
      setShowReasonModal(true);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: BulkAction) => {
    setIsProcessing(true);
    try {
      switch (action.action) {
        case 'approve':
          await supabase
            .from('applications')
            .update({ 
              status: 'approved',
              final_decision_reason: action.reason,
              reviewed_at: new Date().toISOString()
            })
            .in('id', action.applicationIds);
          break;

        case 'reject':
          await supabase
            .from('applications')
            .update({ 
              status: 'rejected',
              final_decision_reason: action.reason,
              reviewed_at: new Date().toISOString()
            })
            .in('id', action.applicationIds);
          break;

        case 'set_status':
          await supabase
            .from('applications')
            .update({ 
              status: action.value,
              reviewed_at: new Date().toISOString()
            })
            .in('id', action.applicationIds);
          break;

        case 'schedule_interview':
          await supabase
            .from('applications')
            .update({ 
              status: 'interview_scheduled',
              interview_scheduled: true,
              interview_date: action.value,
              reviewed_at: new Date().toISOString()
            })
            .in('id', action.applicationIds);
          break;

        case 'set_priority':
          await supabase
            .from('applications')
            .update({ priority: action.value })
            .in('id', action.applicationIds);
          break;

        case 'add_tag':
          // This would require a more complex query to add tags to existing arrays
          const { data: apps } = await supabase
            .from('applications')
            .select('id, tags')
            .in('id', action.applicationIds);

          if (apps) {
            for (const app of apps) {
              const newTags = [...(app.tags || []), action.value].filter((tag, index, arr) => arr.indexOf(tag) === index);
              await supabase
                .from('applications')
                .update({ tags: newTags })
                .eq('id', app.id);
            }
          }
          break;
      }

      onActionComplete();
      onClearSelection();
      setShowReasonModal(false);
      setReason('');
      setCurrentAction(null);
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Failed to perform bulk action');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmBulkAction = () => {
    if (currentAction) {
      executeBulkAction({
        ...currentAction,
        reason: reason || undefined
      });
    }
  };

  if (selectedApplications.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">
              {selectedApplications.length} application{selectedApplications.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction({ action: 'approve', applicationIds: selectedApplications })}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Approve All</span>
            </button>

            <button
              onClick={() => handleBulkAction({ action: 'reject', applicationIds: selectedApplications })}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <XSquare className="w-4 h-4" />
              <span>Reject All</span>
            </button>

            <select
              value={newStatus}
              onChange={(e) => {
                setNewStatus(e.target.value);
                handleBulkAction({ 
                  action: 'set_status', 
                  applicationIds: selectedApplications,
                  value: e.target.value
                });
              }}
              disabled={isProcessing}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="pending">Set Pending</option>
              <option value="under_review">Set Under Review</option>
              <option value="interview_scheduled">Schedule Interview</option>
            </select>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                handleBulkAction({ 
                  action: 'set_priority', 
                  applicationIds: selectedApplications,
                  value: e.target.value
                });
              }}
              disabled={isProcessing}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </select>

            <div className="flex items-center space-x-2">
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => {
                  if (interviewDate) {
                    handleBulkAction({ 
                      action: 'schedule_interview', 
                      applicationIds: selectedApplications,
                      value: interviewDate
                    });
                    setInterviewDate('');
                  }
                }}
                disabled={isProcessing || !interviewDate}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                placeholder="Add tag..."
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => {
                  if (tagValue.trim()) {
                    handleBulkAction({ 
                      action: 'add_tag', 
                      applicationIds: selectedApplications,
                      value: tagValue.trim()
                    });
                    setTagValue('');
                  }
                }}
                disabled={isProcessing || !tagValue.trim()}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Tag className="w-4 h-4" />
                <span>Tag</span>
              </button>
            </div>

            <button
              onClick={onClearSelection}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">
                  {currentAction?.action === 'approve' ? 'Approve' : 'Reject'} Applications
                </h3>
              </div>
              
              <p className="text-slate-300 mb-4">
                You are about to {currentAction?.action} {selectedApplications.length} application{selectedApplications.length !== 1 ? 's' : ''}. 
                Please provide a reason for this decision.
              </p>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for decision..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              />

              <div className="flex space-x-3">
                <button
                  onClick={confirmBulkAction}
                  disabled={isProcessing}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                    currentAction?.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-gray-600 text-white`}
                >
                  {isProcessing ? 'Processing...' : `Confirm ${currentAction?.action === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
                <button
                  onClick={() => {
                    setShowReasonModal(false);
                    setReason('');
                    setCurrentAction(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;
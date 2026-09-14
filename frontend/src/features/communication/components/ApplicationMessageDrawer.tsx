import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  CheckCheck,
  Check,
  Clock,
  User,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  useApplicationMessages,
  useSendMessage,
} from '../hooks';

interface ApplicationMessageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
  currentUserId?: string;
}

export const ApplicationMessageDrawer: React.FC<ApplicationMessageDrawerProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName = 'Candidate',
  jobTitle = 'Job Position',
  currentUserId,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useApplicationMessages(
    isOpen ? applicationId : undefined,
    isOpen // poll every 5s while drawer is open
  );

  const sendMutation = useSendMessage(applicationId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sendMutation.isPending) return;

    const body = inputText.trim();
    setInputText('');

    try {
      await sendMutation.mutateAsync({ body });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input text on failure
      setInputText(body);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs flex justify-end">
      <div className="w-full max-w-lg bg-surface h-full shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border-default bg-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
              {candidateName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-text-primary truncate">
                {candidateName}
              </h2>
              <p className="text-[11px] text-text-secondary truncate flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-brand-600" />
                <span>{jobTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Close conversation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Loading conversation thread...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center space-y-2 px-6">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-text-primary">Direct Application Messaging</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Connect directly regarding interviews, scheduling clarifications, and follow-ups.
                Messages are confidential and application-scoped.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = currentUserId ? msg.senderId === currentUserId : msg.senderRole === 'RECRUITER';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-text-secondary">
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] text-text-muted">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words shadow-2xs ${
                      isMine
                        ? 'bg-brand-600 text-white rounded-br-xs'
                        : 'bg-surface-muted text-text-primary border border-border-default rounded-bl-xs'
                    }`}
                  >
                    {msg.body}
                  </div>

                  {isMine && (
                    <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-text-muted">
                      {msg.isRead ? (
                        <span className="flex items-center gap-0.5 text-brand-600">
                          <CheckCheck className="w-3 h-3" /> Seen
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Sent
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Composer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-border-default bg-surface-muted flex items-end gap-2"
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 p-2.5 text-xs text-text-primary bg-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none placeholder:text-text-muted"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim() || sendMutation.isPending}
            className="h-10 px-3.5 rounded-xl shrink-0 gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

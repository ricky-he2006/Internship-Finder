import React from 'react';
import { Bot } from 'lucide-react';

/**
 * Animated typing indicator shown while the AI is processing.
 *
 * @returns {React.ReactElement}
 */
export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bot size={16} color="#6366f1" />
      </div>
      <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span className="typing-label">InternFinder is thinking…</span>
    </div>
  );
}

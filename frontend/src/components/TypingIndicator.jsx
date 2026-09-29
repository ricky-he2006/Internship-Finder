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
      <div className="typing-indicator__avatar">
        <Bot size={16} />
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

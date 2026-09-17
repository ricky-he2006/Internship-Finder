import { useState, useCallback, useRef } from 'react';
import { chat as apiChat } from '../api';

/**
 * Hook managing chat state, message history, and session lifecycle.
 *
 * @returns {{ messages, sessionId, isTyping, error, sendMessage, reset, updateProfile, scrollRef }}
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messageListRef = useRef(null);

  /**
   * Send a user message and get a bot reply.
   * @param {string} text - Message content.
   * @param {string[]} [activeSkills] - Optional skill override.
   */
  const sendMessage = useCallback(async (text, activeSkills) => {
    if (!text.trim()) return;
    if (isTyping) return;

    setIsTyping(true);
    setError(null);

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const reply = await apiChat(text.trim(), sessionId, activeSkills);
      const newSessionId = reply.session_id;

      if (!sessionId) {
        setSessionId(newSessionId);
      }

      const botMsg = {
        role: 'assistant',
        content: reply.reply,
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, botMsg]);
      setSessionId(newSessionId);
    } catch (err) {
      const errMsg = err.message || 'Something went wrong. Please try again.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: errMsg, id: Date.now() + 1 },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, isTyping]);

  /**
   * Send a lightweight update with modified active skills (no full chat).
   * @param {string[]} activeSkills
   */
  const updateProfile = useCallback(async (activeSkills) => {
    try {
      await apiChat('', sessionId, activeSkills);
    } catch (err) {
      console.error('[useChat] updateProfile failed:', err.message);
    }
  }, [sessionId]);

  /**
   * Reset conversation to empty state.
   */
  const reset = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    setIsTyping(false);
  }, []);

  /**
   * Auto-scroll ref callback.
   * @param {HTMLElement} el
   */
  const scrollRef = useCallback((el) => {
    if (el) {
      messageListRef.current = el;
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  return { messages, sessionId, isTyping, error, sendMessage, reset, updateProfile, scrollRef };
}

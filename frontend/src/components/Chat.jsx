import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import './Chat.css'

/**
 * Main chat interface for the Internship Finder app.
 * Renders a scrollable message list, a text input bar, and a send button.
 *
 * @param {object} props
 * @param {string | null} [props.sessionId=null] - The chat session ID (reserved for future session management).
 * @param {(sessionId: string) => void} [props.onSessionChange] - Callback when a new session is created or selected (reserved).
 * @param {object | null} [props.profile=null] - The user's profile object (reserved for future integration).
 * @returns {JSX.Element}
 */
function Chat({ sessionId: _sessionId, onSessionChange: _onSessionChange, profile: _profile = null }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Auto-resize textarea as content grows
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue, adjustTextareaHeight])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isTyping) return

    const userMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate a backend response after a short delay
    // In production, this would be an API call
    setTimeout(() => {
      const assistantMessage = {
        role: 'assistant',
        content:
          'Here is a sample internship that matches your profile. Check out the details below!',
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }, [inputValue, isTyping])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="chat-container">
      {/* Message list */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-placeholder">
            <div>
              <div className="placeholder-title">
                Start a conversation about internships...
              </div>
              <div className="placeholder-subtitle">
                Ask me about opportunities, roles, or how to improve your chances.
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              isLatest={idx === messages.length - 1}
            />
          ))
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!inputValue.trim() || isTyping}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

export default Chat

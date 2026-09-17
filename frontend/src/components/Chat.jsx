import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { useChat } from '../hooks/useChat'
import './Chat.css'

/** Storage key matching the one used in Layout.jsx */
const SKILLS_STORAGE_KEY = 'internfinder_profile_skills'

/** Quick-start suggestions shown in the welcome screen */
const SUGGESTIONS = [
  'Find me a Python backend internship',
  'Show React frontend opportunities',
  'Machine learning roles for juniors',
  'DevOps and cloud engineering gigs',
]

/**
 * Main chat interface for the Internship Finder app.
 * Uses the useChat hook for real API integration.
 * Reads active skills from localStorage to match Layout's state.
 *
 * @returns {JSX.Element}
 */
export default function Chat() {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const { messages, isTyping, error, sendMessage } = useChat()

  // Read active skills from the same storage that Layout uses
  const [activeSkills, setActiveSkills] = useState(() => {
    try {
      const raw = localStorage.getItem(SKILLS_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // Re-sync skills when the sidebar picker or skill tagger changes
  useEffect(() => {
    const handleSkillsChange = () => {
      try {
        const raw = localStorage.getItem(SKILLS_STORAGE_KEY)
        if (raw) setActiveSkills(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
    window.addEventListener('internfinder-skills-change', handleSkillsChange)
    return () => window.removeEventListener('internfinder-skills-change', handleSkillsChange)
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

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

    sendMessage(text, activeSkills)
    setInputValue('')
  }, [inputValue, isTyping, sendMessage, activeSkills])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleSuggestionClick = useCallback(
    (text) => {
      setInputValue('')
      sendMessage(text, activeSkills)
    },
    [sendMessage, activeSkills],
  )

  return (
    <div className="chat-container">
      {/* Message list */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-placeholder">
            <div>
              <div className="placeholder-icon">
                <Sparkles size={24} />
              </div>
              <div className="placeholder-title">
                Find your next internship
              </div>
              <div className="placeholder-subtitle">
                Ask me about opportunities, roles, or how to improve your chances.
              </div>
            </div>

            {/* Quick-start suggestions */}
            <div className="welcome-suggestions">
              {SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  className="welcome-suggestion"
                  onClick={() => handleSuggestionClick(text)}
                  type="button"
                >
                  {text}
                </button>
              ))}
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
        <div className="input-wrapper">
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
            className="btn-send"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send message"
            type="button"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

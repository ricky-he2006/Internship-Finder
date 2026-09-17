import { AlertTriangle } from 'lucide-react'
import InternshipCard from './InternshipCard'
import './Chat.css'

/**
 * Parses the content of a message, splitting it into text segments
 * and [INTERN_CARD] blocks.
 *
 * @param {string} content - Raw message content.
 * @returns {{ text: string; card?: { title: string; company: string; location: string; pay: string; deadline: string; match_level: string; skills: string; link: string; notes: string } }[]}
 */
function parseMessageContent(content) {
  if (!content) return []

  const result = []
  // Split on [INTERN_CARD] and [/INTERN_CARD] markers, keeping delimiters
  const parts = content.split(/(\[INTERN_CARD\]|\[\/INTERN_CARD\])/)

  let inCard = false
  let cardBuffer = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (part === '[INTERN_CARD]') {
      inCard = true
      cardBuffer = ''
    } else if (part === '[/INTERN_CARD]') {
      inCard = false
      // Parse the card content
      const card = {}
      const lines = cardBuffer
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      for (const line of lines) {
        const colonIndex = line.indexOf(':')
        if (colonIndex !== -1) {
          const key = line.slice(0, colonIndex).trim()
          const value = line.slice(colonIndex + 1).trim()
          card[key] = value
        }
      }
      if (Object.keys(card).length > 0) {
        result.push({ card })
      }
    } else if (inCard) {
      cardBuffer += part
    } else {
      // Text segment outside cards
      const trimmed = part.trim()
      if (trimmed) {
        // Split text into paragraphs by double newline
        const paragraphs = trimmed.split(/\n\n+/)
        for (const p of paragraphs) {
          if (p.trim()) {
            result.push({ text: p.trim() })
          }
        }
      }
    }
  }

  return result
}

/**
 * Renders a single message bubble. Handles plain text,
 * [INTERN_CARD] blocks (rendered as InternshipCard components),
 * and system messages.
 *
 * @param {object} props
 * @param {{ role: 'user' | 'assistant' | 'system'; content: string }} props.message - The message object containing role and content.
 * @param {boolean} [props.isLatest=false] - Whether this message is the latest one (triggers highlight).
 * @returns {JSX.Element}
 */
function MessageBubble({ message, isLatest = false }) {
  const { role, content } = message || {}

  // System messages render as a simple alert-style row
  if (role === 'system' && content) {
    return (
      <div className="message-wrapper system">
        <div className={`message-bubble system ${isLatest ? 'message-is-latest' : ''}`}>
          <span className="system-alert">
            <AlertTriangle size={14} />
            <span className="message-content">{content}</span>
          </span>
        </div>
      </div>
    )
  }

  const segments = parseMessageContent(content)

  if (segments.length === 0) {
    return null
  }

  return (
    <div className={`message-wrapper ${role}`}>
      <div className={`message-bubble ${role} ${isLatest ? 'message-is-latest' : ''}`}>
        {segments.map((seg, idx) => {
          if (seg.card) {
            return <InternshipCard key={`card-${idx}`} card={seg.card} />
          }
          // Wrap each text segment in a <p> tag
          return <p key={`text-${idx}`} className="message-content">{seg.text}</p>
        })}
      </div>
    </div>
  )
}

export default MessageBubble

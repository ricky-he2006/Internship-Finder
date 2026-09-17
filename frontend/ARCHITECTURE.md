# Internship Finder — UI Architecture

## Color Palette

| Role | Light Mode | Dark Mode |
|---|---|---|
| Primary | `#6366f1` | `#818cf8` |
| Primary hover | `#4f46e5` | `#6366f1` |
| Dark panel (sidebar) | `#0f172a` | `#020617` |
| Sidebar text | `#e2e8f0` | `#cbd5e1` |
| Sidebar muted | `#94a3b8` | `#64748b` |
| Page bg | `#f8fafc` | `#0b1120` |
| Card bg | `#ffffff` | `#1e293b` |
| Card border | `#e2e8f0` | `#334155` |
| Surface (input bar) | `#ffffff` | `#1e293b` |
| Text primary | `#0f172a` | `#e2e8f0` |
| Text secondary | `#64748b` | `#94a3b8` |
| Accent green (match high) | `#10b981` | `#34d399` |
| Accent amber (match med) | `#f59e0b` | `#fbbf24` |
| Accent red (match low) | `#ef4444` | `#f87171` |
| Skill chip (selected) | `#6366f1` | `#6366f1` |
| Skill chip (unselected) | `#f1f5f9` | `#334155` |
| Upload zone border | `#cbd5e1` | `#475569` |
| Upload zone bg | `#f8fafc` | `#0f172a` |

**Shadows:**
- Light: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Dark: `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)`

## Typography

- Font family: `Inter, system-ui, -apple-system, sans-serif` (load via `index.html`)
- Heading: 600 weight, `#0f172a` / `#e2e8f0`
- Body: 400 weight, 15px, 1.6 line-height, `#64748b` / `#94a3b8`
- Code: `JetBrains Mono, ui-monospace, monospace`, 14px, 1.5 line-height
- Small labels: 13px, 500 weight

## CSS Strategy

- Custom CSS only (no Tailwind). Use CSS custom properties for all theme values.
- One `src/styles/theme.css` for global variables + base resets.
- One `src/App.css` for layout shell.
- Each component in its own `.css` file alongside its `.jsx`.
- Use CSS Grid for layout, Flexbox for component internals.
- `border-radius: 12px` for cards, `8px` for buttons/chips, `6px` for inputs.
- All transitions use `cubic-bezier(0.4, 0, 0.2, 1)` at 200ms for state changes.

## File Tree

```
src/
  main.jsx                  # Mount <App />
  index.css                 # Minimal reset, CSS vars
  styles/
    theme.css               # :root color tokens, typography base
  components/
    Sidebar/
      Sidebar.jsx            # Dark collapsible panel
      Sidebar.css
    Chat/
      Chat.jsx               # Message list + input bar (parent)
      Chat.css
      MessageBubble.jsx      # User vs assistant bubble
      MessageBubble.css
      TypingIndicator.jsx    # Three-dot pulse animation
      TypingIndicator.css
      InternshipCard.jsx     # Renders [INTERN_CARD] output
      InternshipCard.css
    ResumeUpload/
      ResumeUpload.jsx       # Drop zone + file picker
      ResumeUpload.css
    SkillPicker/
      SkillPicker.jsx        # Skill chip grid + Apply button
      SkillPicker.css
  hooks/
    useApi.js                # Wraps fetch for /chat and /parse-resume
    useChatState.js          # Manages messages, session, profile state
  App.jsx                    # Orchestrates layout + state
  App.css
```

## Component Interface Specs

### App (orchestrator)

**Props:** none

**State:**
```ts
sessionId: string           // generated on mount (nanoid)
messages: { id, role, content, timestamp }[]
profile: { name, degree, school, year, gpa, skills, summary } | null
sidebarOpen: boolean         // mobile: overlay; desktop: collapsible
activeSkills: string[]       // currently selected skills
```

**Layout:**
- Desktop: flex row — Sidebar (280px fixed, collapses to 60px with icons) | Chat (flex: 1)
- Mobile: Chat full-width, Sidebar slides in as overlay (85vw) via CSS transform

**API calls:**
- `POST /chat` → append assistant message, streaming feel (instant append + replace)
- `POST /parse-resume` → update profile state with parsed data
- On mount: `GET /` health check

### Sidebar

**Props:** `{ profile, activeSkills, onSkillsChange, onProfile, children? }`

**Sections:**
1. Header with app logo/text and collapse toggle
2. SkillPicker (embedded)
3. Profile summary (read-only, shown after upload)
4. Footer with session id display (collapsible)

**State:** `collapsed: boolean`

### Chat

**Props:** `{ messages, activeSkills, onSend, isTyping }`

**Internal state:** `inputValue: string`

**Sub-components:** MessageBubble[], TypingIndicator, ResumeUpload (inline), InputBar

**Key behavior:**
- Auto-scroll to bottom on new message
- On Enter: send, clear input
- On `/skills <comma-separated>`: quick-skill-change command
- Messages render markdown-like cards when content contains `[INTERN_CARD]` tokens

### MessageBubble

**Props:** `{ role: 'user' | 'assistant', content: string, timestamp: Date }`

**Rendering rules:**
- User: right-aligned, indigo bg (`#6366f1`), white text
- Assistant: left-aligned, card bg, text-colored
- Detect `[INTERN_CARD]` blocks in content and render InternshipCard instead of raw text
- Content outside `[]` blocks renders as paragraphs

### InternshipCard

**Props:** `{ title, company, location, matchLevel, description, requirements, deadline }`

**Match level badges:**
- High: green pill `#10b981` / `#34d399` with "90-100% match"
- Medium: amber pill `#f59e0b` / `#fbbf24` with "70-89% match"
- Low: red pill `#ef4444` / `#f87171` with "<70% match"

**Structure:**
- Header: company name (bold) + match badge inline
- Body: title, location, deadline, description
- Footer: requirements list with checkmarks

### TypingIndicator

**Props:** `{ visible: boolean }`

**Visual:** Three dots, each animating with staggered 160ms delays. Vertical bounce, 400ms per cycle. Fades in/out with 200ms opacity transition.

### ResumeUpload

**Props:** `{ onParseComplete: (profile) => void }`

**State:** `{ isDragging: boolean, uploading: boolean, progress: number }`

**Behavior:**
- Drag-and-drop triggers visual highlight (dashed border + bg change)
- File picker fallback via button click
- On drop: validate file (PDF only, <5MB), POST to `/parse-resume`
- Show progress indicator during upload (fake progress since multipart has no events)
- On success: replace with a file card showing parsed name/school + "Change file" button
- On error: inline error message under the zone

### SkillPicker

**Props:** `{ skills: string[], activeSkills: string[], onChange: (skills) => void }`

**State:** `tempSkills: string[]` (local draft, synced on Apply)

**Layout:**
- Grid of chips, 2 columns on mobile, 3 on desktop
- Each chip: skill name + checkmark icon when selected
- Hover: scale(1.03), box-shadow
- Selected: indigo bg, white text, checkmark icon from lucide-react
- "Apply" button at bottom (indigo bg, full width, white text)
- On Apply: updates parent state, triggers profile re-evaluation via chat

## Animation / Interaction Notes

1. **Chat message appearance:** Slide up 8px + opacity 0→1, 250ms ease-out. Staggered by 60ms per message.
2. **Sidebar collapse:** Width transition 300ms with spring easing. Icons remain visible; text fades out.
3. **Skill chip toggle:** Scale 1→1.08→1 (150ms), color crossfade (200ms).
4. **Typing indicator:** Three dots pulse vertically with staggered delays (160ms apart), infinite loop.
5. **Upload zone drag:** Dashed border animates from `#cbd5e1` to `#6366f1`, background shifts to `#eef2ff` / dark equivalent.
6. **InternshipCard render:** Fade in 200ms, then slide up 6px.
7. **Send button:** Icon rotates 15° on hover, shows loading spinner during API call.
8. **Mobile:** Sidebar becomes overlay (85vw), backdrop blur behind it. Chat takes full width.

## API Integration Layer

`useApi.js` provides:
```js
// POST /chat
async function sendMessage(sessionId, message, activeSkills) {
  const res = await fetch('/chat', {  // proxied via Vite config
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId, active_skills: activeSkills })
  });
  return res.json();
}

// POST /parse-resume (multipart)
async function uploadResume(sessionId, file) {
  const form = new FormData();
  form.append('file', file);
  if (sessionId) form.append('session_id', sessionId);
  const res = await fetch('/parse-resume', { method: 'POST', body: form });
  return res.json();
}
```

Vite proxy config (`vite.config.js`):
```js
server: {
  proxy: {
    '/chat': 'http://localhost:8000',
    '/parse-resume': 'http://localhost:8000',
  }
}
```

## Session Management

- Generate `sessionId` on first mount using `nanoid` or simple timestamp-based ID
- Pass session ID with every message to maintain conversation history
- Upload resume first → chat uses session to provide skill-matched results

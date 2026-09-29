import { useState, useEffect, useCallback } from 'react'
import { Menu, X, CheckCircle } from 'lucide-react'
import Sidebar from './Sidebar'
import ResumeUpload from './ResumeUpload'

const ALL_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust',
  'React', 'Vue', 'Angular', 'Node.js', 'FastAPI', 'Django', 'SQL',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'ML/DL', 'Data Science',
  'Git', 'Linux', 'WebGL', 'Swift', 'Kotlin', 'Flutter',
]

// Session storage helper (no server yet — persists in localStorage)
const STORAGE_KEY = 'internfinder_profile'

/**
 * Layout shell for the InternFinder application.
 * Manages sidebar state, profile, and skill selection, and renders
 * the header, sidebar, skill picker, and the main content area.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content rendered inside the main area
 * @param {string} [props.title] - Title shown in the header bar
 * @param {string|null} [props.sessionStatus] - Optional session status text shown next to the header
 */
export default function Layout({ children, title = 'InternFinder', sessionStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profile, setProfile] = useState(() => loadProfile())
  const [activeSkills, setActiveSkills] = useState(() => loadSkills())
  const [uploadOpen, setUploadOpen] = useState(false)

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      // ignore — localStorage may not be available
    }
    return null
  }

  function loadSkills() {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_skills`)
      if (raw) return JSON.parse(raw)
    } catch {
      // ignore
    }
    return []
  }

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleSkillToggle = useCallback((skill) => {
    setActiveSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    )
  }, [])

  /** Persist skills and notify cross-tab listeners via custom event. */
  const persistSkills = useCallback((skills) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_skills`, JSON.stringify(skills))
      window.dispatchEvent(new CustomEvent('internfinder-skills-change'))
    } catch {
      // ignore storage quota errors
    }
  }, [])

  const handleSaveSkills = useCallback(
    (skills) => {
      setActiveSkills(skills)
      persistSkills(skills)
    },
    [persistSkills],
  )

  const handleProfileUpdate = useCallback((newProfile) => {
    setProfile(newProfile)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile))
    } catch {
      // ignore
    }
  }, [])

  const handleUploadComplete = useCallback((profile) => {
    handleProfileUpdate(profile)
  }, [handleProfileUpdate])

  // Close sidebar on small screens when the window resizes below 768px
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [sidebarOpen])

  return (
    <div className="app-layout">
      {/* Header bar */}
      <header className="app-header">
        <button
          className="app-header__toggle"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          type="button"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="app-header__title">{title}</h1>
        {sessionStatus && (
          <div className="app-header__status">
            <CheckCircle size={16} className="app-header__status-icon" />
            <span>{sessionStatus}</span>
          </div>
        )}
        {!sessionStatus && profile && (
          <div className="app-header__profile-pill">
            <CheckCircle size={14} className="app-header__profile-icon" />
            <span>Profile set</span>
          </div>
        )}
      </header>

      {/* Layout row: sidebar + main */}
      <div className="app-layout__body">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          profile={profile}
          skills={ALL_SKILLS}
          activeSkills={activeSkills}
          onSkillToggle={handleSkillToggle}
          onSaveSkills={handleSaveSkills}
          onResumeUpload={() => setUploadOpen(true)}
        />

        <main className="app-main">
          {/* Upload modal shown when user clicks "Upload resume" */}
          {uploadOpen && (
            <div
              className="app-main__upload-overlay"
              onClick={() => setUploadOpen(false)}
              role="presentation"
            >
              <div
                className="app-main__upload-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Upload your resume"
              >
                <h2 className="app-main__upload-title">Upload your resume</h2>
                <p className="app-main__upload-subtitle">
                  We'll extract your profile automatically.
                </p>
                <ResumeUpload
                  sessionId={null}
                  onUploadComplete={handleUploadComplete}
                  loading={false}
                />
                <button
                  className="app-main__upload-close"
                  onClick={() => setUploadOpen(false)}
                  type="button"
                >
                  {profile ? 'Done' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Menu,
  X,
  User,
  GraduationCap,
  Check,
  Sparkles,
  Paperclip,
} from 'lucide-react'

const ALL_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust',
  'React', 'Vue', 'Angular', 'Node.js', 'FastAPI', 'Django', 'SQL',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'ML/DL', 'Data Science',
  'Git', 'Linux', 'WebGL', 'Swift', 'Kotlin', 'Flutter',
]

/**
 * Sidebar component with profile card, skill chips, and save button.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sidebar is currently open
 * @param {() => void} props.onToggle - Callback to toggle sidebar visibility
 * @param {object|null} props.profile - User profile object (name, degree, school, year)
 * @param {string[]} props.skills - Full list of available skills
 * @param {string[]} props.activeSkills - Currently selected skill names
 * @param {(skill: string) => void} props.onSkillToggle - Callback when a skill chip is clicked
 * @param {(skillIds: string[]) => void} props.onSaveSkills - Callback to persist selected skills
 * @param {(profile: any) => void} props.onResumeUpload - Callback triggered by resume upload
 */
export default function Sidebar({
  isOpen,
  onToggle,
  profile,
  skills = [],
  activeSkills = [],
  onSkillToggle,
  onSaveSkills,
  onResumeUpload,
}) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSaveSkills(activeSkills)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleResumeUpload = () => {
    if (onResumeUpload) onResumeUpload()
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}
        aria-label="Application sidebar"
      >
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <Sparkles size={22} className="sidebar__logo-icon" />
            <span className="sidebar__title">InternFinder</span>
          </div>
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            type="button"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Profile card */}
        <div className="sidebar__profile">
          {profile ? (
            <>
              <div className="sidebar__profile-header">
                <User size={18} className="sidebar__profile-icon" />
                <span className="sidebar__profile-name">{profile.name || 'User'}</span>
              </div>
              <p className="sidebar__profile-detail">
                <GraduationCap size={14} className="sidebar__profile-icon--small" />
                {profile.degree} — {profile.school}
              </p>
              <p className="sidebar__profile-year">Year {profile.year}</p>
            </>
          ) : (
            <>
              <p className="sidebar__no-profile">No profile yet</p>
              <button
                className="sidebar__upload-btn"
                onClick={handleResumeUpload}
                type="button"
              >
                <Paperclip size={14} />
                Upload resume
              </button>
            </>
          )}
        </div>

        {/* Skills section */}
        <div className="sidebar__skills">
          <h2 className="sidebar__section-title">Skills</h2>
          <ul className="sidebar__skill-list">
            {skills.map((skill) => {
              const isActive = activeSkills.includes(skill)
              return (
                <li key={skill}>
                  <button
                    className={`sidebar__skill-chip ${isActive ? 'sidebar__skill-chip--active' : ''}`}
                    onClick={() => onSkillToggle?.(skill)}
                    type="button"
                    aria-pressed={isActive}
                  >
                    {isActive && <Check size={12} />}
                    {skill}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Save button */}
        <div className="sidebar__actions">
          {saved ? (
            <div className="sidebar__save-saved">
              <Check size={16} className="sidebar__save-saved-icon" />
              Skills saved!
            </div>
          ) : (
            <button
              className="sidebar__save-btn"
              onClick={handleSave}
              type="button"
              disabled={!activeSkills.length}
            >
              Save Skills
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

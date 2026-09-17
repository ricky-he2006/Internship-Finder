import { Check } from 'lucide-react'

/**
 * SkillPicker panel that displays a grid of selectable skill chips.
 *
 * @param {Object} props
 * @param {string[]} props.skills - Full list of available skill names
 * @param {string[]} props.selected - Currently selected skill names
 * @param {(selected: string[]) => void} props.onChange - Callback with updated selection array
 */
export default function SkillPicker({ skills = [], selected = [], onChange }) {
  const handleToggle = (skill) => {
    const next = selected.includes(skill)
      ? selected.filter((s) => s !== skill)
      : [...selected, skill]
    onChange(next)
  }

  return (
    <div className="skill-picker">
      <p className="skill-picker__hint">
        Select your strengths to get better matches
      </p>
      <div className="skill-picker__grid">
        {skills.map((skill) => {
          const isSelected = selected.includes(skill)
          return (
            <button
              key={skill}
              className={`skill-picker__chip ${isSelected ? 'skill-picker__chip--selected' : ''}`}
              onClick={() => handleToggle(skill)}
              type="button"
              aria-pressed={isSelected}
            >
              {isSelected && <Check size={14} className="skill-picker__check" />}
              {skill}
            </button>
          )
        })}
      </div>
    </div>
  )
}

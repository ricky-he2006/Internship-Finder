import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Renders a parsed internship card with match badge, tags, and skills.
 *
 * @param {object} props
 * @param {{title: string, company: string, location: string, pay: string, deadline: string, match_level: string, skills: string, link: string, notes: string}} props.card
 * @returns {React.ReactElement}
 */
export default function InternshipCard({ card }) {
  const {
    title = 'Untitled Position',
    company = '',
    location = '',
    pay = '',
    deadline = '',
    match_level = 'low',
    skills = '',
    link = '',
    notes = '',
  } = card;

  const skillList = skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="internship-card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {company && <div className="card-company">{company}</div>}
        </div>
        <span className={`match-badge ${match_level.toLowerCase()}`}>
          {match_level === 'high' ? 'High Match' : match_level === 'medium' ? 'Medium' : 'Low'}
        </span>
      </div>

      <div className="card-tags">
        {location && <span className="tag">{location}</span>}
        {pay && <span className="tag">{pay}</span>}
        {deadline && <span className="tag">{deadline}</span>}
      </div>

      {skillList.length > 0 && (
        <div className="card-skills">
          {skillList.map((skill, i) => (
            <span className="skill-tag" key={i}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {notes && <div className="card-notes">"{notes}"</div>}

      {link && (
        <a className="card-link" href={link} target="_blank" rel="noopener noreferrer">
          View Posting <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

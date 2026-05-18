import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

// ── Master skill list (for student autocomplete) ─────────────────────────────
export const ALL_SKILLS = [
  // Programming Languages
  'JavaScript','TypeScript','Python','Java','C','C++','C#','Go','Rust','Kotlin','Swift',
  'PHP','Ruby','Scala','R','MATLAB','Dart','Perl','Bash','Shell Scripting',
  // Frontend
  'React','React Native','Next.js','Vue.js','Nuxt.js','Angular','Svelte','HTML5','CSS3',
  'Tailwind CSS','SASS/SCSS','Bootstrap','Redux','Zustand','GraphQL','REST APIs',
  'Figma','Adobe XD','UI/UX Design','Responsive Design','Web Accessibility',
  // Backend
  'Node.js','Express.js','Django','Flask','FastAPI','Spring Boot','Laravel',
  'Ruby on Rails','ASP.NET','NestJS','Fastify',
  // Databases
  'MongoDB','PostgreSQL','MySQL','SQLite','Redis','Elasticsearch','Firebase',
  'DynamoDB','Cassandra','Oracle DB','MS SQL Server','Supabase',
  // DevOps & Cloud
  'Docker','Kubernetes','CI/CD','GitHub Actions','Jenkins','AWS','Azure','GCP',
  'Terraform','Ansible','Linux','Nginx','Apache','Vercel','Netlify',
  // AI/ML
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','Pandas',
  'NumPy','OpenCV','NLP','Computer Vision','Hugging Face','LangChain','Generative AI',
  'Data Analysis','Data Visualization','Power BI','Tableau',
  // Mobile
  'Android Development','iOS Development','Flutter','React Native','Ionic','Xamarin',
  // Design
  'Figma','Adobe Photoshop','Adobe Illustrator','Adobe After Effects','Blender',
  'Canva','Sketch','InVision','Procreate','CorelDRAW',
  // Other
  'Git','GitHub','GitLab','Agile','Scrum','JIRA','Postman','Swagger',
  'Blockchain','Solidity','Cybersecurity','Ethical Hacking','Networking',
  'Excel','Google Sheets','MS Office','Content Writing','SEO','Digital Marketing',
  'Communication','Leadership','Project Management','Problem Solving','Critical Thinking',
];

// ── Role → Skills map (for admin drive creation) ─────────────────────────────
export const ROLE_SKILLS = {
  'Software Developer': ['JavaScript','TypeScript','React','Node.js','Python','Git','REST APIs','MongoDB','PostgreSQL','Docker'],
  'Software Developer Intern': ['JavaScript','TypeScript','React','Node.js','Python','Git','REST APIs','MongoDB'],
  'Frontend Developer': ['HTML5','CSS3','JavaScript','React','Vue.js','TypeScript','Tailwind CSS','Figma','Git','REST APIs'],
  'Frontend Developer Intern': ['HTML5','CSS3','JavaScript','React','TypeScript','Tailwind CSS','Figma','Git'],
  'Backend Developer': ['Node.js','Express.js','Python','Django','PostgreSQL','MongoDB','REST APIs','Docker','Git','Redis'],
  'Backend Developer Intern': ['Node.js','Python','REST APIs','MongoDB','PostgreSQL','Git','Express.js'],
  'Full Stack Developer': ['React','Node.js','TypeScript','MongoDB','PostgreSQL','Docker','REST APIs','Git','Redis','AWS'],
  'Full Stack Developer Intern': ['React','Node.js','JavaScript','MongoDB','REST APIs','Git','HTML5','CSS3'],
  'UI/UX Designer': ['Figma','Adobe XD','UI/UX Design','Sketch','User Research','Prototyping','Responsive Design','HTML5','CSS3'],
  'UI/UX Designer Intern': ['Figma','Adobe XD','UI/UX Design','Sketch','Prototyping'],
  'Data Analyst': ['Python','SQL','Pandas','NumPy','Tableau','Power BI','Excel','Data Visualization','Statistics'],
  'Data Analyst Intern': ['Python','Excel','SQL','Pandas','Data Visualization'],
  'Machine Learning Engineer': ['Python','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Machine Learning','Deep Learning','Git'],
  'ML Intern': ['Python','Scikit-learn','Pandas','NumPy','Machine Learning','Git'],
  'AI/ML Intern': ['Python','TensorFlow','Machine Learning','Pandas','NumPy','Deep Learning'],
  'Data Science Intern': ['Python','Pandas','NumPy','Machine Learning','SQL','Data Visualization','Scikit-learn'],
  'DevOps Engineer': ['Docker','Kubernetes','CI/CD','GitHub Actions','AWS','Linux','Terraform','Ansible','Git','Nginx'],
  'DevOps Intern': ['Docker','Linux','Git','CI/CD','GitHub Actions','Shell Scripting'],
  'Cloud Intern': ['AWS','Azure','GCP','Docker','Linux','Git','Networking'],
  'Android Developer': ['Kotlin','Java','Android Development','Git','REST APIs','Firebase'],
  'Android Intern': ['Kotlin','Android Development','Git','Firebase'],
  'iOS Developer': ['Swift','iOS Development','Xcode','Git','REST APIs'],
  'Mobile Developer Intern': ['Flutter','React Native','Git','Android Development','iOS Development'],
  'Cybersecurity Intern': ['Networking','Ethical Hacking','Cybersecurity','Linux','Python','Bash'],
  'Embedded Systems Intern': ['C','C++','Embedded Systems','RTOS','Microcontrollers','Python'],
  'Product Manager Intern': ['Agile','JIRA','Figma','Communication','Project Management','Data Analysis'],
  'Business Analyst Intern': ['Excel','SQL','Data Analysis','Communication','Power BI','Problem Solving'],
  'Marketing Intern': ['Content Writing','SEO','Digital Marketing','Google Sheets','Communication','Canva'],
  'Content Writer Intern': ['Content Writing','SEO','Communication','MS Office','Research'],
  'Graphic Designer Intern': ['Adobe Photoshop','Adobe Illustrator','Canva','Figma','CorelDRAW'],
  'Animation Intern': ['Blender','Adobe After Effects','Motion Graphics','3D Modeling'],
  'Research Intern': ['Python','R','MATLAB','Data Analysis','Machine Learning','Communication','Research'],
  'Finance Intern': ['Excel','Financial Modeling','Accounting','Communication','MS Office'],
  'HR Intern': ['Communication','MS Office','Excel','Recruitment','Leadership'],
};

// ── Helper: get suggestions for a role ───────────────────────────────────────
export function getSkillsForRole(role) {
  if (!role) return [];
  const normalized = role.trim();
  if (ROLE_SKILLS[normalized]) return ROLE_SKILLS[normalized];
  // fuzzy match
  const lower = normalized.toLowerCase();
  const key = Object.keys(ROLE_SKILLS).find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
  if (key) return ROLE_SKILLS[key];
  // fallback: generic tech skills
  return ['JavaScript','Python','Git','REST APIs','Communication','Problem Solving'];
}

// ── DriveSkillPicker — for admin drive creation (role-based presets) ─────────
export function DriveSkillPicker({ role, selected, onChange }) {
  const suggestions = getSkillsForRole(role);

  const toggle = (skill) => {
    if (selected.includes(skill)) {
      onChange(selected.filter(s => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <div className="skill-picker-wrap">
      {suggestions.length > 0 && (
        <>
          <div className="skill-picker-hint">
            💡 Suggested skills for <strong>{role || 'this role'}</strong> — click to add:
          </div>
          <div className="skill-suggestions-grid">
            {suggestions.map(skill => (
              <button
                key={skill}
                type="button"
                className={`skill-suggestion-chip ${selected.includes(skill) ? 'selected' : ''}`}
                onClick={() => toggle(skill)}
              >
                {selected.includes(skill) ? '✓ ' : '+ '}
                {skill}
              </button>
            ))}
          </div>
        </>
      )}
      {selected.length > 0 && (
        <div className="skill-selected-tags">
          <div className="skill-picker-label">Selected skills ({selected.length}):</div>
          <div className="skill-tags-row">
            {selected.map(s => (
              <span key={s} className="skill-tag-chip">
                {s}
                <button type="button" onClick={() => onChange(selected.filter(x => x !== s))}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      {role && suggestions.length === 0 && (
        <p className="skill-picker-hint text-dimmed">No suggestions available for this role yet.</p>
      )}
    </div>
  );
}

// ── StudentSkillPicker — autocomplete with Enter-to-add-custom ───────────────
export function StudentSkillPicker({ skills, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = query.length >= 2
    ? ALL_SKILLS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase()) && !skills.includes(s)
      ).slice(0, 12)
    : [];

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) {
      onChange([...skills, s]);
    }
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        addSkill(filtered[0]);
      } else if (query.trim()) {
        addSkill(query.trim());
      }
    }
    if (e.key === 'Escape') setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="student-skill-picker" ref={containerRef}>
      {/* Existing skills */}
      {skills.length > 0 && (
        <div className="skill-tags-row" style={{ marginBottom: 10 }}>
          {skills.map(s => (
            <span key={s} className="skill-tag-chip">
              {s}
              <button type="button" onClick={() => onChange(skills.filter(x => x !== s))}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="skill-input-wrap">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search skills (e.g. js, react, python)… or press Enter to add custom"
          autoComplete="off"
        />
        {query.trim() && (
          <button
            type="button"
            className="skill-input-clear"
            onClick={() => { setQuery(''); setOpen(false); }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (filtered.length > 0 || query.trim().length >= 1) && (
        <div className="skill-dropdown">
          {filtered.map(skill => (
            <button
              key={skill}
              type="button"
              className="skill-dropdown-item"
              onMouseDown={() => addSkill(skill)}
            >
              {skill}
            </button>
          ))}
          {query.trim() && !ALL_SKILLS.some(s => s.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              className="skill-dropdown-item skill-dropdown-custom"
              onMouseDown={() => addSkill(query.trim())}
            >
              <span className="skill-add-icon">+</span> Add &quot;<strong>{query.trim()}</strong>&quot; as custom skill
              <span className="skill-hint-badge">Press Enter</span>
            </button>
          )}
          {filtered.length === 0 && query.trim().length < 2 && (
            <div className="skill-dropdown-hint">Type at least 2 characters to search</div>
          )}
        </div>
      )}
    </div>
  );
}

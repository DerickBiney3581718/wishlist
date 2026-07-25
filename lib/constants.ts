export const COURSES = [
  { id: 'data-science-ai',            label: 'Data Science & AI',            color: '#0082D4' },
  { id: 'web-app-pentesting',         label: 'Web App Penetration Testing',   color: '#E35336' },
  { id: 'cybersecurity-fundamentals', label: 'Cybersecurity Fundamentals',    color: '#2da85a' },
  { id: 'cloud-engineering',          label: 'Cloud Engineering',             color: '#a855f7' },
  { id: 'virtual-assistantship',      label: 'Virtual Assistantship',         color: '#f59e0b' },
  { id: 'data-engineering',           label: 'Data Engineering',              color: '#06b6d4' },
  { id: 'video-editing',              label: 'Video Editing',                 color: '#ec4899' },
  { id: 'animation',                  label: 'Animation',                     color: '#8b5cf6' },
  { id: 'graphic-design',             label: 'Graphic Design',                color: '#f97316' },
  { id: 'software-engineering',       label: 'Software Engineering',          color: '#0082D4' },
  { id: 'ai-engineering',             label: 'AI Engineering',                color: '#10b981' },
  { id: 'prompt-engineering',         label: 'Prompt Engineering',            color: '#6366f1' },
  { id: 'mobile-app-development',     label: 'Mobile App Development',        color: '#E35336' },
  { id: 'software-testing-qa',        label: 'Software Testing & QA',         color: '#84cc16' },
] as const

export type CourseId = typeof COURSES[number]['id']

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'Netherlands', 'France', 'Switzerland', 'Sweden', 'Norway',
  'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Rwanda',
  'Tanzania', 'Uganda', 'Cameroon', 'Senegal', 'Ethiopia',
  'India', 'Singapore', 'UAE', 'Other',
]

export const ROLES = [
  'Student',
  'Recent Graduate',
  'Developer / Engineer',
  'Data Analyst',
  'IT / Sysadmin',
  'Designer',
  'Business / Marketing',
  'Teacher / Educator',
  'Career Switcher',
  'Entrepreneur',
  'Other',
]

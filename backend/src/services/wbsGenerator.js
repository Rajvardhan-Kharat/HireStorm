/**
 * WBS Auto-Generator
 * Generates a 13-week Work Breakdown Structure based on domain/skills.
 * Output matches Internship.wbs schema: { week, topic, tasks: [{ task, status }] }
 */

const TEMPLATES = {
  'Full Stack': [
    { week: 1, topic: 'Onboarding & Setup',       tasks: ['Environment setup & onboarding', 'Codebase walkthrough', 'First pull request'] },
    { week: 2, topic: 'Authentication Module',     tasks: ['Feature: Authentication module', 'Unit tests', 'Code review participation'] },
    { week: 3, topic: 'Dashboard UI',              tasks: ['Feature: Dashboard UI', 'REST API integration', 'Bug fixes'] },
    { week: 4, topic: 'Database Optimization',     tasks: ['Feature: Database optimization', 'Performance testing', 'Documentation'] },
    { week: 5, topic: 'Notifications System',      tasks: ['Feature: Notifications system', 'WebSocket integration', 'Testing'] },
    { week: 6, topic: 'Mid-Program Review',        tasks: ['Mid-program review prep', 'Bug bash session', 'Code refactoring'] },
    { week: 7, topic: 'File Upload & Storage',     tasks: ['Feature: File upload module', 'Cloud storage integration', 'Security review'] },
    { week: 8, topic: 'Analytics Dashboard',       tasks: ['Feature: Analytics dashboard', 'Chart integration', 'Data visualization'] },
    { week: 9, topic: 'Admin Panel & RBAC',        tasks: ['Feature: Admin panel', 'RBAC implementation', 'Testing'] },
    { week: 10, topic: 'Performance & DevOps',     tasks: ['Performance optimization', 'Load testing', 'CI/CD setup'] },
    { week: 11, topic: 'Mobile & Accessibility',   tasks: ['Feature: Mobile responsiveness', 'Cross-browser testing', 'Accessibility audit'] },
    { week: 12, topic: 'Final Integration & QA',   tasks: ['Final feature integration', 'E2E testing', 'Documentation update'] },
    { week: 13, topic: 'Handover & Presentation',  tasks: ['Project handover', 'Presentation preparation', 'Final demo'] },
  ],
  'Data Science': [
    { week: 1, topic: 'Data Exploration',          tasks: ['Data source identification', 'Environment setup (Python/Jupyter)', 'EDA overview'] },
    { week: 2, topic: 'Data Cleaning',             tasks: ['Data cleaning pipeline', 'Missing value analysis', 'Initial statistics'] },
    { week: 3, topic: 'Feature Engineering',       tasks: ['Feature engineering', 'Correlation analysis', 'Visualization'] },
    { week: 4, topic: 'Baseline Modelling',        tasks: ['Baseline model training', 'Model evaluation metrics', 'Documentation'] },
    { week: 5, topic: 'Model Optimization',        tasks: ['Hyperparameter tuning', 'Cross-validation', 'Model comparison'] },
    { week: 6, topic: 'Mid-Program Review',        tasks: ['Mid-program review', 'Report writing', 'Results presentation'] },
    { week: 7, topic: 'Advanced Models',           tasks: ['Advanced model (ensemble)', 'Bias/variance analysis', 'Testing'] },
    { week: 8, topic: 'Model Deployment',          tasks: ['Model deployment (Flask API)', 'Dockerization', 'API testing'] },
    { week: 9, topic: 'Dashboard & Monitoring',    tasks: ['Dashboard creation (Streamlit)', 'Live data integration', 'Review'] },
    { week: 10, topic: 'Benchmarking',             tasks: ['Performance benchmarking', 'Monitoring setup', 'Documentation'] },
    { week: 11, topic: 'Domain Module',            tasks: ['NLP/CV module (domain-specific)', 'Fine-tuning', 'Testing'] },
    { week: 12, topic: 'Final Report',             tasks: ['Final report', 'Results compilation', 'Peer review'] },
    { week: 13, topic: 'Demo & Handover',          tasks: ['Presentation prep', 'Demo day', 'Handover documentation'] },
  ],
  'UI/UX Design': [
    { week: 1, topic: 'Research & Discovery',      tasks: ['Design brief review', 'Competitor analysis', 'User persona creation'] },
    { week: 2, topic: 'Information Architecture',  tasks: ['Information architecture', 'User flow diagrams', 'Sitemap'] },
    { week: 3, topic: 'Wireframes',                tasks: ['Low-fidelity wireframes', 'Stakeholder review', 'Iterations'] },
    { week: 4, topic: 'High-Fidelity Design',      tasks: ['High-fidelity mockups', 'Design system setup', 'Component library'] },
    { week: 5, topic: 'Prototype & Testing',       tasks: ['Prototype (Figma)', 'Usability testing plan', 'Feedback collection'] },
    { week: 6, topic: 'Mid-Review',                tasks: ['Mid-review session', 'Design revisions', 'Accessibility check'] },
    { week: 7, topic: 'Micro-Interactions',        tasks: ['Micro-interaction design', 'Animation specs', 'Handoff prep'] },
    { week: 8, topic: 'Developer Handoff',         tasks: ['Developer handoff', 'Figma annotations', 'QA with dev team'] },
    { week: 9, topic: 'User Testing',              tasks: ['User testing sessions', 'Heatmap analysis', 'Iteration'] },
    { week: 10, topic: 'Responsive Design',        tasks: ['Mobile design adaptation', 'Responsive testing', 'Documentation'] },
    { week: 11, topic: 'Final Polish',             tasks: ['Final design polish', 'Brand consistency review', 'Presentation deck'] },
    { week: 12, topic: 'Case Study',              tasks: ['Case study writing', 'Portfolio piece preparation', 'Peer review'] },
    { week: 13, topic: 'Presentation & Handover', tasks: ['Final presentation', 'Design handover', 'Retrospective'] },
  ],
  'DevOps & Cloud': [
    { week: 1, topic: 'Cloud Fundamentals',        tasks: ['AWS/GCP/Azure account setup', 'IAM roles and policies', 'Cloud cost overview'] },
    { week: 2, topic: 'CI/CD Pipeline',            tasks: ['GitHub Actions setup', 'Docker containerization', 'Pipeline testing'] },
    { week: 3, topic: 'Infrastructure as Code',    tasks: ['Terraform basics', 'EC2/VM provisioning', 'VPC configuration'] },
    { week: 4, topic: 'Container Orchestration',   tasks: ['Kubernetes cluster setup', 'Pod deployment', 'Service configuration'] },
    { week: 5, topic: 'Monitoring & Alerting',     tasks: ['Prometheus setup', 'Grafana dashboards', 'Alert rules'] },
    { week: 6, topic: 'Mid-Program Review',        tasks: ['Architecture review', 'Security audit', 'Documentation'] },
    { week: 7, topic: 'Database Management',       tasks: ['RDS/Cloud SQL setup', 'Backup strategies', 'Replication'] },
    { week: 8, topic: 'Load Balancing & Scaling',  tasks: ['Auto-scaling groups', 'Load balancer configuration', 'Stress testing'] },
    { week: 9, topic: 'Security & Compliance',     tasks: ['WAF setup', 'SSL/TLS management', 'Compliance checklist'] },
    { week: 10, topic: 'Serverless Architecture',  tasks: ['Lambda functions', 'API Gateway', 'Event-driven workflows'] },
    { week: 11, topic: 'Disaster Recovery',        tasks: ['Backup policies', 'DR drill', 'RTO/RPO planning'] },
    { week: 12, topic: 'Cost Optimization',        tasks: ['Reserved instances', 'Right-sizing', 'Cost reports'] },
    { week: 13, topic: 'Final Deployment',         tasks: ['Production deployment', 'Runbook creation', 'Handover'] },
  ],
};

const DEFAULT_TEMPLATE = TEMPLATES['Full Stack'];

/**
 * @param {Date} startDate - Internship start date
 * @param {string[]} skills - Intern's skills array
 * @param {string} [domain] - Optional domain override
 * @returns {Array} WBS array matching schema: { week, topic, tasks: [{ task, status }] }
 */
const generateWBS = (startDate, skills = [], domain = '') => {
  let template = DEFAULT_TEMPLATE;

  const combined = (skills.join(' ') + ' ' + domain).toLowerCase();

  if (combined.includes('data') || combined.includes('ml') || combined.includes('python') || combined.includes('machine learning')) {
    template = TEMPLATES['Data Science'];
  } else if (combined.includes('figma') || combined.includes('design') || combined.includes('ux') || combined.includes('ui')) {
    template = TEMPLATES['UI/UX Design'];
  } else if (combined.includes('devops') || combined.includes('cloud') || combined.includes('aws') || combined.includes('docker') || combined.includes('kubernetes')) {
    template = TEMPLATES['DevOps & Cloud'];
  }

  return template.map(({ week, topic, tasks }) => ({
    week,
    topic,
    tasks: tasks.map(task => ({
      task,
      status: 'PENDING',
    })),
  }));
};

module.exports = { generateWBS };

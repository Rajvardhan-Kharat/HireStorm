'use strict';

/**
 * HireStorm – Comprehensive Dummy Data Seed Script
 * Run: node d:\Projects\int\HireStorm\backend\seedDummyData.js
 *
 * ✔ Idempotent  – checks existing records before inserting
 * ✔ Graceful    – catches duplicate-key errors and continues
 * ✔ Password    – uses new User(data).save() so pre-save hook hashes passwords
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const slugify  = require('slugify');
const path     = require('path');

// ─── Load models ────────────────────────────────────────────────────────────
const User        = require('./src/models/User');
const Company     = require('./src/models/Company');
const Course      = require('./src/models/Course');
const Listing     = require('./src/models/Listing');
const Application = require('./src/models/Application');
const Hackathon   = require('./src/models/Hackathon');
const Internship  = require('./src/models/Internship');
const Transaction = require('./src/models/Transaction');
const CampusDrive = require('./src/models/CampusDrive');
const College     = require('./src/models/College');

// ─── MongoDB URI ─────────────────────────────────────────────────────────────
const MONGO_URI =
  'mongodb+srv://raj-inno-123:hc1Hlnw0m1Qx5gmU@cluster0.s84kqdc.mongodb.net/hirestorm?retryWrites=true&w=majority&appName=Cluster0';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const counters = {
  companies: 0, users: 0, courses: 0, listings: 0,
  applications: 0, hackathons: 0, internships: 0,
  transactions: 0, campusDrives: 0, colleges: 0,
};

function daysAgo(n)   { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`  ↩  User already exists: ${data.email}`);
    return existing;
  }
  const user = new User(data);   // pre-save hook will hash the password
  await user.save();
  counters.users++;
  console.log(`  ✔  Created user: ${data.email}`);
  return user;
}

async function upsertCompany(data) {
  const existing = await Company.findOne({ name: data.name });
  if (existing) {
    console.log(`  ↩  Company already exists: ${data.name}`);
    return existing;
  }
  const company = await Company.create(data);
  counters.companies++;
  console.log(`  ✔  Created company: ${data.name}`);
  return company;
}

async function upsertCourse(data) {
  const existing = await Course.findOne({ slug: data.slug });
  if (existing) {
    console.log(`  ↩  Course already exists: ${data.slug}`);
    return existing;
  }
  const course = await Course.create(data);
  counters.courses++;
  console.log(`  ✔  Created course: ${data.title}`);
  return course;
}

async function upsertListing(data) {
  const existing = await Listing.findOne({ title: data.title, company: data.company });
  if (existing) {
    console.log(`  ↩  Listing already exists: ${data.title}`);
    return existing;
  }
  const listing = await Listing.create(data);
  counters.listings++;
  console.log(`  ✔  Created listing: ${data.title}`);
  return listing;
}

async function upsertHackathon(data) {
  const existing = await Hackathon.findOne({ title: data.title });
  if (existing) {
    console.log(`  ↩  Hackathon already exists: ${data.title}`);
    return existing;
  }
  // Use new + save so the pre-save slug hook fires
  const hack = new Hackathon(data);
  await hack.save();
  counters.hackathons++;
  console.log(`  ✔  Created hackathon: ${data.title}`);
  return hack;
}

async function upsertInternship(internId) {
  const existing = await Internship.findOne({ intern: internId });
  if (existing) {
    console.log(`  ↩  Internship already exists for intern: ${internId}`);
    return existing;
  }
  return null;  // caller creates it
}

async function upsertCollege(data) {
  const existing = await College.findOne({ email: data.email });
  if (existing) {
    console.log(`  ↩  College already exists: ${data.name}`);
    return existing;
  }
  const college = new College(data);
  await college.save();
  counters.colleges++;
  console.log(`  ✔  Created college: ${data.name}`);
  return college;
}

// ─── Build daily logs array ───────────────────────────────────────────────────
function buildDailyLogs(count, startDate, allReviewed = false) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const status = allReviewed ? 'REVIEWED' : (i % 3 === 0 ? 'REVIEWED' : 'SUBMITTED');
    logs.push({
      date,
      workDone: `Completed assigned task #${i + 1} – implemented feature/fix as per sprint plan.`,
      blockers:  i % 5 === 0 ? 'Minor blocker with environment setup' : '',
      hoursWorked: 6 + (i % 3),
      status,
      mentorScore: status === 'REVIEWED' ? 6 + (i % 5) : undefined,
    });
  }
  return logs;
}

// ─── Build monthly reviews ────────────────────────────────────────────────────
function buildMonthlyReview(month, score, startDate, mentorId) {
  const reviewDate = new Date(startDate);
  reviewDate.setDate(reviewDate.getDate() + month * 30);
  const quarter = Math.floor(score / 4);
  return {
    month,
    reviewDate,
    rubric: {
      taskCompletion: quarter,
      codeQuality:    quarter,
      communication:  Math.floor((score - quarter * 3) / 1),
      initiative:     quarter,
    },
    totalScore: score,
    feedback: `Month ${month} review: Good progress. Keep it up!`,
    status: 'COMPLETED',
    reviewedBy: mentorId,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log('\n🌱  HireStorm Seed Script Starting…\n');
  await mongoose.connect(MONGO_URI);
  console.log('✔  MongoDB connected\n');

  // ── 1. COMPANIES ────────────────────────────────────────────────────────────
  console.log('━━━  COMPANIES  ━━━');
  const now = new Date();

  const techNova = await upsertCompany({
    name: 'TechNova Solutions',
    logo: 'https://via.placeholder.com/150?text=TechNova',
    website: 'https://technova.example.com',
    industry: 'IT/Software',
    size: '201-500',
    description: 'Leading IT and software solutions provider based in Mumbai.',
    location: 'Mumbai, Maharashtra',
    isVerified: true,
    subscription: {
      tier: 'GROWTH',
      startDate: daysAgo(90),
      endDate: daysAhead(275),
      features: {
        topListingSlots: 10,
        bulkHiringTools: true,
        premiumATS: true,
        candidateDBAccess: false,
        hackathonHosting: false,
      },
    },
  });

  const dataPulse = await upsertCompany({
    name: 'DataPulse Analytics',
    logo: 'https://via.placeholder.com/150?text=DataPulse',
    website: 'https://datapulse.example.com',
    industry: 'Data Science',
    size: '51-200',
    description: 'Cutting-edge data science and analytics company in Bangalore.',
    location: 'Bangalore, Karnataka',
    isVerified: true,
    subscription: {
      tier: 'ENTERPRISE',
      startDate: daysAgo(120),
      endDate: daysAhead(245),
      features: {
        topListingSlots: 25,
        bulkHiringTools: true,
        premiumATS: true,
        candidateDBAccess: true,
        hackathonHosting: true,
      },
    },
  });

  const cloudWave = await upsertCompany({
    name: 'CloudWave Technologies',
    logo: 'https://via.placeholder.com/150?text=CloudWave',
    website: 'https://cloudwave.example.com',
    industry: 'Cloud/DevOps',
    size: '51-200',
    description: 'Cloud infrastructure and DevOps solutions company in Hyderabad.',
    location: 'Hyderabad, Telangana',
    isVerified: true,
    subscription: {
      tier: 'STARTER',
      startDate: daysAgo(60),
      endDate: daysAhead(305),
      features: {
        topListingSlots: 5,
        bulkHiringTools: false,
        premiumATS: true,
        candidateDBAccess: false,
        hackathonHosting: false,
      },
    },
  });

  const designCraft = await upsertCompany({
    name: 'DesignCraft Studio',
    logo: 'https://via.placeholder.com/150?text=DesignCraft',
    website: 'https://designcraft.example.com',
    industry: 'Design/UX',
    size: '1-10',
    description: 'Creative design studio specialising in UI/UX and branding, Pune.',
    location: 'Pune, Maharashtra',
    isVerified: false,
    subscription: {
      tier: 'FREE',
      startDate: daysAgo(30),
      endDate: daysAhead(335),
      features: {
        topListingSlots: 0,
        bulkHiringTools: false,
        premiumATS: false,
        candidateDBAccess: false,
        hackathonHosting: false,
      },
    },
  });

  // ── 2. COMPANY ADMINS ───────────────────────────────────────────────────────
  console.log('\n━━━  COMPANY ADMINS  ━━━');

  const adminTechNova = await upsertUser({
    email: 'admin@technova.com',
    password: 'Password123',
    role: 'COMPANY_ADMIN',
    profile: { firstName: 'Vikram', lastName: 'Nair' },
    isActive: true,
    isVerified: true,
    companyRef: techNova._id,
  });

  const adminDataPulse = await upsertUser({
    email: 'admin@datapulse.com',
    password: 'Password123',
    role: 'COMPANY_ADMIN',
    profile: { firstName: 'Meera', lastName: 'Iyer' },
    isActive: true,
    isVerified: true,
    companyRef: dataPulse._id,
  });

  const adminCloudWave = await upsertUser({
    email: 'admin@cloudwave.com',
    password: 'Password123',
    role: 'COMPANY_ADMIN',
    profile: { firstName: 'Rohit', lastName: 'Sharma' },
    isActive: true,
    isVerified: true,
    companyRef: cloudWave._id,
  });

  const adminDesignCraft = await upsertUser({
    email: 'admin@designcraft.com',
    password: 'Password123',
    role: 'COMPANY_ADMIN',
    profile: { firstName: 'Ananya', lastName: 'Gupta' },
    isActive: true,
    isVerified: true,
    companyRef: designCraft._id,
  });

  // Link admins to companies
  await Company.updateOne({ _id: techNova._id },    { $addToSet: { admins: adminTechNova._id } });
  await Company.updateOne({ _id: dataPulse._id },   { $addToSet: { admins: adminDataPulse._id } });
  await Company.updateOne({ _id: cloudWave._id },   { $addToSet: { admins: adminCloudWave._id } });
  await Company.updateOne({ _id: designCraft._id }, { $addToSet: { admins: adminDesignCraft._id } });
  console.log('  ✔  Linked admins to companies');

  // ── 3. MENTOR ───────────────────────────────────────────────────────────────
  console.log('\n━━━  MENTOR  ━━━');
  const mentor = await upsertUser({
    email: 'mentor@hirestorm.com',
    password: 'Pass123',
    role: 'COMPANY_HR',
    profile: { firstName: 'Sanjay', lastName: 'Mehta' },
    isActive: true,
    isVerified: true,
  });

  // ── 4. STUDENTS ─────────────────────────────────────────────────────────────
  console.log('\n━━━  STUDENTS  ━━━');

  const arjun   = await upsertUser({ email: 'arjun@student.com',  password: 'Pass123', role: 'STUDENT',     profile: { firstName: 'Arjun',  lastName: 'Sharma'  }, isActive: true, isVerified: false });
  const priya   = await upsertUser({ email: 'priya@student.com',  password: 'Pass123', role: 'PRO_STUDENT', profile: { firstName: 'Priya',  lastName: 'Patel'   }, isActive: true, isVerified: true  });
  const rahul   = await upsertUser({ email: 'rahul@student.com',  password: 'Pass123', role: 'INTERN',      profile: { firstName: 'Rahul',  lastName: 'Kumar'   }, isActive: true, isVerified: true  });
  const sneha   = await upsertUser({ email: 'sneha@student.com',  password: 'Pass123', role: 'INTERN',      profile: { firstName: 'Sneha',  lastName: 'Joshi'   }, isActive: true, isVerified: true  });
  const amit    = await upsertUser({ email: 'amit@student.com',   password: 'Pass123', role: 'STUDENT',     profile: { firstName: 'Amit',   lastName: 'Singh'   }, isActive: true, isVerified: true  });
  const divya   = await upsertUser({ email: 'divya@student.com',  password: 'Pass123', role: 'PRO_STUDENT', profile: { firstName: 'Divya',  lastName: 'Nair'    }, isActive: true, isVerified: true  });
  const karan   = await upsertUser({ email: 'karan@student.com',  password: 'Pass123', role: 'STUDENT',     profile: { firstName: 'Karan',  lastName: 'Mehta'   }, isActive: true, isVerified: false });
  const ankita  = await upsertUser({ email: 'ankita@student.com', password: 'Pass123', role: 'PRO_STUDENT', profile: { firstName: 'Ankita', lastName: 'Rao'     }, isActive: true, isVerified: true  });

  const allStudents = [arjun, priya, rahul, sneha, amit, divya, karan, ankita];

  // ── 5. COURSES ──────────────────────────────────────────────────────────────
  console.log('\n━━━  COURSES  ━━━');

  const makeLesson = (title, type, order, duration = 15) => ({ title, type, content: `Content for ${title}`, duration, order });

  const course1 = await upsertCourse({
    title: 'Full Stack Web Development',
    slug: 'full-stack-web-development',
    instructor: 'Vikram Nair',
    description: 'Comprehensive full-stack web development course covering React, Node.js and MongoDB.',
    category: 'Technical',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
    price: { amount: 2999, currency: 'INR' },
    isFree: false,
    isPublished: true,
    totalEnrollments: 342,
    rating: 4.6,
    modules: [
      { title: 'HTML & CSS Fundamentals', order: 1, lessons: [makeLesson('Introduction to HTML', 'VIDEO', 1, 12), makeLesson('CSS Basics', 'VIDEO', 2, 18), makeLesson('HTML Quiz', 'QUIZ', 3, 10), makeLesson('CSS Assignment', 'ASSIGNMENT', 4, 30)] },
      { title: 'JavaScript & React', order: 2, lessons: [makeLesson('JS Fundamentals', 'VIDEO', 1, 20), makeLesson('React Components', 'VIDEO', 2, 25), makeLesson('Hooks Deep Dive', 'VIDEO', 3, 22)] },
      { title: 'Backend with Node.js', order: 3, lessons: [makeLesson('Node.js Intro', 'VIDEO', 1, 18), makeLesson('REST APIs', 'VIDEO', 2, 22), makeLesson('MongoDB Integration', 'VIDEO', 3, 20), makeLesson('Final Project', 'ASSIGNMENT', 4, 60)] },
    ],
  });

  const course2 = await upsertCourse({
    title: 'Machine Learning Fundamentals',
    slug: 'machine-learning-fundamentals',
    instructor: 'Meera Iyer',
    description: 'Learn machine learning from scratch with Python, scikit-learn, and TensorFlow.',
    category: 'Technical',
    skills: ['Python', 'scikit-learn', 'TensorFlow', 'NumPy', 'Pandas'],
    price: { amount: 3999, currency: 'INR' },
    isFree: false,
    isPublished: true,
    totalEnrollments: 215,
    rating: 4.7,
    modules: [
      { title: 'Python for ML', order: 1, lessons: [makeLesson('Python Basics', 'VIDEO', 1, 15), makeLesson('NumPy & Pandas', 'VIDEO', 2, 20), makeLesson('Data Viz', 'VIDEO', 3, 18)] },
      { title: 'Supervised Learning', order: 2, lessons: [makeLesson('Linear Regression', 'VIDEO', 1, 22), makeLesson('Decision Trees', 'VIDEO', 2, 20), makeLesson('SVM Quiz', 'QUIZ', 3, 15), makeLesson('Model Evaluation', 'READING', 4, 10)] },
      { title: 'Deep Learning Intro', order: 3, lessons: [makeLesson('Neural Networks', 'VIDEO', 1, 25), makeLesson('TensorFlow Basics', 'VIDEO', 2, 28), makeLesson('CNN Overview', 'VIDEO', 3, 22)] },
    ],
  });

  const course3 = await upsertCourse({
    title: 'UI/UX Design Masterclass',
    slug: 'ui-ux-design-masterclass',
    instructor: 'Ananya Gupta',
    description: 'Master UI/UX design with Figma, user research, and prototyping.',
    category: 'Design',
    skills: ['Figma', 'User Research', 'Prototyping', 'Wireframing', 'Design Systems'],
    price: { amount: 1999, currency: 'INR' },
    isFree: false,
    isPublished: true,
    totalEnrollments: 178,
    rating: 4.5,
    modules: [
      { title: 'Design Fundamentals', order: 1, lessons: [makeLesson('Design Principles', 'VIDEO', 1, 14), makeLesson('Color Theory', 'VIDEO', 2, 16), makeLesson('Typography', 'READING', 3, 8)] },
      { title: 'Figma Mastery', order: 2, lessons: [makeLesson('Figma Interface', 'VIDEO', 1, 18), makeLesson('Auto Layout', 'VIDEO', 2, 20), makeLesson('Components & Variants', 'VIDEO', 3, 22), makeLesson('Figma Assignment', 'ASSIGNMENT', 4, 45)] },
      { title: 'User Research & Testing', order: 3, lessons: [makeLesson('User Interviews', 'VIDEO', 1, 16), makeLesson('Usability Testing', 'VIDEO', 2, 18), makeLesson('Prototyping', 'VIDEO', 3, 20)] },
    ],
  });

  const course4 = await upsertCourse({
    title: 'Cloud Architecture with AWS',
    slug: 'cloud-architecture-with-aws',
    instructor: 'Rohit Sharma',
    description: 'Build scalable cloud infrastructure using AWS services and best practices.',
    category: 'Technical',
    skills: ['AWS', 'EC2', 'S3', 'Lambda', 'CloudFormation', 'Docker'],
    price: { amount: 4999, currency: 'INR' },
    isFree: false,
    isPublished: true,
    totalEnrollments: 124,
    rating: 4.8,
    modules: [
      { title: 'AWS Fundamentals', order: 1, lessons: [makeLesson('AWS Global Infra', 'VIDEO', 1, 15), makeLesson('IAM & Security', 'VIDEO', 2, 20), makeLesson('EC2 Deep Dive', 'VIDEO', 3, 25), makeLesson('AWS Quiz', 'QUIZ', 4, 15)] },
      { title: 'Storage & Databases', order: 2, lessons: [makeLesson('S3 & Glacier', 'VIDEO', 1, 18), makeLesson('RDS & DynamoDB', 'VIDEO', 2, 22), makeLesson('Caching with ElastiCache', 'VIDEO', 3, 16)] },
      { title: 'Serverless & DevOps', order: 3, lessons: [makeLesson('Lambda Functions', 'VIDEO', 1, 20), makeLesson('API Gateway', 'VIDEO', 2, 18), makeLesson('CloudFormation', 'VIDEO', 3, 22), makeLesson('Final Architecture', 'ASSIGNMENT', 4, 90)] },
    ],
  });

  const course5 = await upsertCourse({
    title: 'Communication & Leadership',
    slug: 'communication-and-leadership',
    instructor: 'Dr. Priya Krishnan',
    description: 'Develop essential communication and leadership skills for the modern workplace.',
    category: 'Soft Skills',
    skills: ['Public Speaking', 'Leadership', 'Team Management', 'Negotiation'],
    price: { amount: 0, currency: 'INR' },
    isFree: true,
    isPublished: true,
    totalEnrollments: 891,
    rating: 4.4,
    modules: [
      { title: 'Effective Communication', order: 1, lessons: [makeLesson('Active Listening', 'VIDEO', 1, 12), makeLesson('Non-Verbal Cues', 'VIDEO', 2, 10), makeLesson('Email Etiquette', 'READING', 3, 8)] },
      { title: 'Leadership Essentials', order: 2, lessons: [makeLesson('Leadership Styles', 'VIDEO', 1, 15), makeLesson('Decision Making', 'VIDEO', 2, 18), makeLesson('Conflict Resolution', 'VIDEO', 3, 14), makeLesson('Leadership Quiz', 'QUIZ', 4, 10)] },
    ],
  });

  const course6 = await upsertCourse({
    title: 'Product Management Essentials',
    slug: 'product-management-essentials',
    instructor: 'Kavya Reddy',
    description: 'Learn product management fundamentals from ideation to launch.',
    category: 'Management',
    skills: ['Product Strategy', 'Roadmapping', 'User Stories', 'Agile', 'Analytics'],
    price: { amount: 2499, currency: 'INR' },
    isFree: false,
    isPublished: true,
    totalEnrollments: 203,
    rating: 4.5,
    modules: [
      { title: 'PM Fundamentals', order: 1, lessons: [makeLesson('What is PM?', 'VIDEO', 1, 12), makeLesson('Product Lifecycle', 'VIDEO', 2, 15), makeLesson('Stakeholder Management', 'READING', 3, 10)] },
      { title: 'Agile & Roadmapping', order: 2, lessons: [makeLesson('Agile & Scrum', 'VIDEO', 1, 18), makeLesson('Writing User Stories', 'VIDEO', 2, 14), makeLesson('Building Roadmaps', 'VIDEO', 3, 16), makeLesson('PM Assignment', 'ASSIGNMENT', 4, 60)] },
      { title: 'Metrics & Growth', order: 3, lessons: [makeLesson('Key Metrics (OKRs)', 'VIDEO', 1, 15), makeLesson('A/B Testing', 'VIDEO', 2, 18), makeLesson('Growth Hacking', 'VIDEO', 3, 12)] },
    ],
  });

  // ── 6. LISTINGS ─────────────────────────────────────────────────────────────
  console.log('\n━━━  LISTINGS  ━━━');
  const deadline = daysAhead(30);

  const listingReactIntern = await upsertListing({
    company: techNova._id,
    postedBy: adminTechNova._id,
    type: 'INTERNSHIP',
    title: 'React Developer Intern',
    description: 'Join TechNova to build world-class web applications using React.js. Work with a seasoned team on real client projects.',
    domain: 'Frontend Development',
    skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    location: 'Mumbai',
    isRemote: false,
    stipend: { amount: 15000, currency: 'INR', period: 'monthly' },
    duration: '6 months',
    openings: 3,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: true,
    tags: ['react', 'frontend', 'internship', 'mumbai'],
  });

  const listingFullStack = await upsertListing({
    company: techNova._id,
    postedBy: adminTechNova._id,
    type: 'JOB',
    title: 'Full Stack Engineer',
    description: 'We are looking for an experienced Full Stack Engineer to join our growing team at TechNova Solutions.',
    domain: 'Full Stack Development',
    skillsRequired: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
    location: 'Mumbai',
    isRemote: true,
    stipend: { amount: 60000, currency: 'INR', period: 'monthly' },
    duration: 'Permanent',
    openings: 2,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: false,
    tags: ['fullstack', 'nodejs', 'react', 'remote'],
  });

  const listingDSIntern = await upsertListing({
    company: dataPulse._id,
    postedBy: adminDataPulse._id,
    type: 'INTERNSHIP',
    title: 'Data Science Intern',
    description: 'Work on cutting-edge ML and analytics projects at DataPulse. Great learning opportunity with mentorship.',
    domain: 'Data Science',
    skillsRequired: ['Python', 'Pandas', 'scikit-learn', 'SQL', 'Statistics'],
    location: 'Bangalore',
    isRemote: false,
    stipend: { amount: 12000, currency: 'INR', period: 'monthly' },
    duration: '3 months',
    openings: 5,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: false,
    tags: ['datascience', 'ml', 'python', 'internship'],
  });

  const listingMLEngineer = await upsertListing({
    company: dataPulse._id,
    postedBy: adminDataPulse._id,
    type: 'JOB',
    title: 'ML Engineer',
    description: 'Join our AI team to build production-grade ML pipelines and deploy models at scale.',
    domain: 'Machine Learning',
    skillsRequired: ['Python', 'TensorFlow', 'MLOps', 'Kubernetes', 'SQL'],
    location: 'Bangalore',
    isRemote: false,
    stipend: { amount: 80000, currency: 'INR', period: 'monthly' },
    duration: 'Permanent',
    openings: 3,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: true,
    tags: ['ml', 'ai', 'tensorflow', 'mlops'],
  });

  const listingDevOpsIntern = await upsertListing({
    company: cloudWave._id,
    postedBy: adminCloudWave._id,
    type: 'INTERNSHIP',
    title: 'DevOps Intern',
    description: 'Learn DevOps practices at CloudWave: CI/CD, Kubernetes, Docker and cloud automation.',
    domain: 'DevOps',
    skillsRequired: ['Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Bash'],
    location: 'Hyderabad',
    isRemote: false,
    stipend: { amount: 10000, currency: 'INR', period: 'monthly' },
    duration: '6 months',
    openings: 2,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: false,
    tags: ['devops', 'kubernetes', 'docker', 'cloud'],
  });

  const listingBackend = await upsertListing({
    company: cloudWave._id,
    postedBy: adminCloudWave._id,
    type: 'JOB',
    title: 'Backend Developer',
    description: 'Build highly scalable backend services and APIs for CloudWave cloud platform. PRO_ONLY listing.',
    domain: 'Backend Development',
    skillsRequired: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS'],
    location: 'Hyderabad',
    isRemote: true,
    stipend: { amount: 55000, currency: 'INR', period: 'monthly' },
    duration: 'Permanent',
    openings: 4,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PRO_ONLY',
    isPinned: false,
    tags: ['backend', 'nodejs', 'go', 'pro'],
  });

  const listingUIIntern = await upsertListing({
    company: designCraft._id,
    postedBy: adminDesignCraft._id,
    type: 'INTERNSHIP',
    title: 'UI Designer Intern',
    description: 'Create beautiful UI designs for web and mobile products at DesignCraft Studio. Figma experience required.',
    domain: 'UI Design',
    skillsRequired: ['Figma', 'Adobe XD', 'UI Design', 'Prototyping'],
    location: 'Pune',
    isRemote: false,
    stipend: { amount: 8000, currency: 'INR', period: 'monthly' },
    duration: '3 months',
    openings: 2,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: false,
    tags: ['design', 'ui', 'figma', 'internship'],
  });

  const listingUXResearcher = await upsertListing({
    company: designCraft._id,
    postedBy: adminDesignCraft._id,
    type: 'PART_TIME',
    title: 'UX Researcher',
    description: 'Conduct user research, usability testing, and help shape product strategy at DesignCraft.',
    domain: 'UX Research',
    skillsRequired: ['User Research', 'Usability Testing', 'Figma', 'Survey Design'],
    location: 'Pune',
    isRemote: true,
    stipend: { amount: 25000, currency: 'INR', period: 'monthly' },
    duration: '6 months',
    openings: 1,
    applicationDeadline: deadline,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isPinned: false,
    tags: ['ux', 'research', 'part-time', 'remote'],
  });

  // ── 7. APPLICATIONS ─────────────────────────────────────────────────────────
  console.log('\n━━━  APPLICATIONS  ━━━');
  const appPairs = [
    { listing: listingReactIntern._id, applicant: arjun._id,  status: 'APPLIED',      atsScore: 72 },
    { listing: listingReactIntern._id, applicant: priya._id,  status: 'SHORTLISTED',  atsScore: 88 },
    { listing: listingReactIntern._id, applicant: amit._id,   status: 'APPLIED',      atsScore: 65 },
    { listing: listingDSIntern._id,    applicant: divya._id,  status: 'INTERVIEW',    atsScore: 91 },
    { listing: listingDSIntern._id,    applicant: karan._id,  status: 'APPLIED',      atsScore: 58 },
    { listing: listingDSIntern._id,    applicant: ankita._id, status: 'SHORTLISTED',  atsScore: 84 },
    { listing: listingFullStack._id,   applicant: arjun._id,  status: 'APPLIED',      atsScore: 70 },
    { listing: listingMLEngineer._id,  applicant: divya._id,  status: 'OFFERED',      atsScore: 95 },
    { listing: listingUIIntern._id,    applicant: karan._id,  status: 'APPLIED',      atsScore: 62 },
    { listing: listingDevOpsIntern._id,applicant: amit._id,   status: 'REJECTED',     atsScore: 45 },
  ];

  for (const ap of appPairs) {
    const existing = await Application.findOne({ listing: ap.listing, applicant: ap.applicant });
    if (existing) {
      console.log(`  ↩  Application already exists`);
      continue;
    }
    await Application.create({
      listing: ap.listing,
      applicant: ap.applicant,
      status: ap.status,
      atsScore: ap.atsScore,
      coverLetter: 'I am very excited about this opportunity and believe my skills align perfectly.',
      resumeSnapshot: 'https://example.com/resume-placeholder.pdf',
    });
    counters.applications++;
    console.log(`  ✔  Created application: ${ap.status}`);
  }

  // ── 8. HACKATHONS ───────────────────────────────────────────────────────────
  console.log('\n━━━  HACKATHONS  ━━━');

  const hack1 = await upsertHackathon({
    title: 'HireStorm BuildSprint 2025',
    description: 'Annual platform hackathon hosted by HireStorm. Build innovative solutions in 48 hours!',
    organizer: adminTechNova._id,
    entryFee: 0,
    teamConfig: { minSize: 2, maxSize: 4 },
    timeline: {
      registrationOpen:  daysAgo(60),
      registrationClose: daysAgo(40),
      hackathonStart:    daysAgo(35),
      phase1Deadline:    daysAgo(34),
      phase2Deadline:    daysAgo(33),
      hackathonEnd:      daysAgo(30),
    },
    status: 'COMPLETED',
    totalRegistrations: 45,
    domains: ['Web Development', 'Mobile', 'AI/ML'],
    tags: ['buildsprint', 'hirestorm', 'annual'],
  });

  const hack2 = await upsertHackathon({
    title: 'DataPulse AI Challenge',
    description: 'Build the next AI innovation with DataPulse. Open to all students with passion for data!',
    organizer: adminDataPulse._id,
    hostedBy: dataPulse._id,
    entryFee: 0,
    teamConfig: { minSize: 1, maxSize: 3 },
    timeline: {
      registrationOpen:  daysAgo(10),
      registrationClose: daysAhead(20),
      hackathonStart:    daysAhead(22),
      phase1Deadline:    daysAhead(23),
      phase2Deadline:    daysAhead(24),
      hackathonEnd:      daysAhead(30),
    },
    status: 'REGISTRATION_OPEN',
    totalRegistrations: 23,
    domains: ['Machine Learning', 'NLP', 'Computer Vision'],
    tags: ['ai', 'datapulse', 'challenge'],
  });

  const hack3 = await upsertHackathon({
    title: 'CloudWave DevOps Hackathon',
    description: 'Solve real-world DevOps challenges. Deploy, scale, and automate your way to victory!',
    organizer: adminCloudWave._id,
    hostedBy: cloudWave._id,
    entryFee: 0,
    teamConfig: { minSize: 2, maxSize: 5 },
    timeline: {
      registrationOpen:  daysAgo(20),
      registrationClose: daysAgo(5),
      hackathonStart:    daysAgo(3),
      phase1Deadline:    daysAgo(2),
      phase2Deadline:    daysAgo(1),
      hackathonEnd:      daysAhead(5),
    },
    status: 'ACTIVE',
    totalRegistrations: 67,
    domains: ['DevOps', 'Cloud', 'Kubernetes'],
    tags: ['devops', 'cloudwave', 'kubernetes'],
  });

  // ── 9. INTERNSHIPS ──────────────────────────────────────────────────────────
  console.log('\n━━━  INTERNSHIPS  ━━━');

  // Internship 1: Rahul – ACTIVE at TechNova
  let internship1 = await Internship.findOne({ intern: rahul._id });
  if (!internship1) {
    const rahulStart = daysAgo(60);
    const rahulEnd   = daysAhead(30);
    const rahulLogs  = buildDailyLogs(45, rahulStart, false);
    const rahulReviews = [
      buildMonthlyReview(1, 82, rahulStart, mentor._id),
      buildMonthlyReview(2, 88, rahulStart, mentor._id),
    ];
    internship1 = await Internship.create({
      intern:   rahul._id,
      mentor:   mentor._id,
      company:  techNova._id,
      source:   'DIRECT',
      startDate: rahulStart,
      endDate:   rahulEnd,
      status:   'ACTIVE',
      offerStatus: 'ACCEPTED',
      stipend:  { amount: 10000, currency: 'INR' },
      dailyLogs: rahulLogs,
      monthlyReviews: rahulReviews,
      continuousAssessmentScore: 85,
      isExamUnlocked: false,
    });
    counters.internships++;
    console.log('  ✔  Created internship: Rahul @ TechNova (ACTIVE)');
    // Link activeInternship on Rahul
    await User.updateOne({ _id: rahul._id }, { activeInternship: internship1._id });
  } else {
    console.log('  ↩  Internship already exists: Rahul');
  }

  // Internship 2: Sneha – COMPLETED at DataPulse
  let internship2 = await Internship.findOne({ intern: sneha._id });
  if (!internship2) {
    const snehaStart = daysAgo(100);
    const snehaEnd   = daysAgo(10);
    const snehaLogs  = buildDailyLogs(70, snehaStart, true);
    const snehaReviews = [
      buildMonthlyReview(1, 90, snehaStart, mentor._id),
      buildMonthlyReview(2, 85, snehaStart, mentor._id),
      buildMonthlyReview(3, 92, snehaStart, mentor._id),
    ];
    internship2 = await Internship.create({
      intern:   sneha._id,
      mentor:   mentor._id,
      company:  dataPulse._id,
      hackathon: hack1._id,
      source:   'HACKATHON',
      startDate: snehaStart,
      endDate:   snehaEnd,
      status:   'COMPLETED',
      offerStatus: 'ACCEPTED',
      stipend:  { amount: 12000, currency: 'INR' },
      dailyLogs: snehaLogs,
      monthlyReviews: snehaReviews,
      continuousAssessmentScore: 89,
      isExamUnlocked: true,
      exam: {
        attemptedAt: daysAgo(5),
        score: 82,
        isPassed: true,
        passMark: 40,
      },
    });
    counters.internships++;
    console.log('  ✔  Created internship: Sneha @ DataPulse (COMPLETED)');
  } else {
    console.log('  ↩  Internship already exists: Sneha');
  }

  // Internship 3: Priya – OFFER_SENT at CloudWave
  let internship3 = await Internship.findOne({ intern: priya._id });
  if (!internship3) {
    internship3 = await Internship.create({
      intern:   priya._id,
      mentor:   mentor._id,
      company:  cloudWave._id,
      source:   'DIRECT',
      startDate: daysAhead(15),
      endDate:   daysAhead(105),
      status:   'OFFER_SENT',
      offerStatus: 'PENDING',
      stipend:  { amount: 10000, currency: 'INR' },
    });
    counters.internships++;
    console.log('  ✔  Created internship: Priya @ CloudWave (OFFER_SENT)');
  } else {
    console.log('  ↩  Internship already exists: Priya');
  }

  // ── 10. TRANSACTIONS ────────────────────────────────────────────────────────
  console.log('\n━━━  TRANSACTIONS  ━━━');

  const txCount = await Transaction.countDocuments();
  if (txCount >= 20) {
    console.log(`  ↩  Transactions already seeded (found ${txCount})`);
  } else {
    const txDocs = [
      // 5x PRO_SUBSCRIPTION @299
      ...([arjun, priya, divya, ankita, amit].map((u, i) => ({
        user: u._id, type: 'PRO_SUBSCRIPTION', amount: 299, currency: 'INR',
        status: 'SUCCESS', metadata: { plan: 'PRO_STUDENT', month: i + 1 },
      }))),
      // 4x COMPANY_TIER_UPGRADE @4999 (GROWTH)
      ...([techNova, cloudWave].map((c, i) => ([
        { company: c._id, type: 'COMPANY_TIER_UPGRADE', amount: 4999, currency: 'INR', status: 'SUCCESS', metadata: { fromTier: 'FREE', toTier: 'GROWTH' } },
        { company: c._id, type: 'COMPANY_TIER_UPGRADE', amount: 4999, currency: 'INR', status: 'SUCCESS', metadata: { fromTier: 'STARTER', toTier: 'GROWTH' } },
      ])).flat()),
      // 3x COMPANY_TIER_UPGRADE @14999 (ENTERPRISE)
      { company: dataPulse._id, type: 'COMPANY_TIER_UPGRADE', amount: 14999, currency: 'INR', status: 'SUCCESS', metadata: { fromTier: 'GROWTH', toTier: 'ENTERPRISE' } },
      { company: dataPulse._id, type: 'COMPANY_TIER_UPGRADE', amount: 14999, currency: 'INR', status: 'SUCCESS', metadata: { fromTier: 'GROWTH', toTier: 'ENTERPRISE', renewal: true } },
      { company: techNova._id,  type: 'COMPANY_TIER_UPGRADE', amount: 14999, currency: 'INR', status: 'SUCCESS', metadata: { fromTier: 'GROWTH', toTier: 'ENTERPRISE' } },
      // 3x COURSE_PURCHASE @2999
      { user: arjun._id,  type: 'COURSE_PURCHASE', amount: 2999, currency: 'INR', status: 'SUCCESS', metadata: { courseId: course1._id.toString(), courseTitle: course1.title } },
      { user: karan._id,  type: 'COURSE_PURCHASE', amount: 2999, currency: 'INR', status: 'SUCCESS', metadata: { courseId: course1._id.toString(), courseTitle: course1.title } },
      { user: ankita._id, type: 'COURSE_PURCHASE', amount: 3999, currency: 'INR', status: 'SUCCESS', metadata: { courseId: course2._id.toString(), courseTitle: course2.title } },
      // 2x HACKATHON_ENTRY @199
      { user: arjun._id, type: 'HACKATHON_ENTRY', amount: 199, currency: 'INR', status: 'SUCCESS', metadata: { hackathonId: hack3._id.toString() } },
      { user: divya._id, type: 'HACKATHON_ENTRY', amount: 199, currency: 'INR', status: 'SUCCESS', metadata: { hackathonId: hack3._id.toString() } },
      // 2x LISTING_PIN @499
      { company: techNova._id,   type: 'LISTING_PIN', amount: 499, currency: 'INR', status: 'SUCCESS', metadata: { listingId: listingReactIntern._id.toString() } },
      { company: dataPulse._id,  type: 'LISTING_PIN', amount: 499, currency: 'INR', status: 'SUCCESS', metadata: { listingId: listingMLEngineer._id.toString() } },
      // 1x HACKATHON_SPONSOR @9999
      { company: dataPulse._id, type: 'HACKATHON_SPONSOR', amount: 9999, currency: 'INR', status: 'SUCCESS', metadata: { hackathonId: hack1._id.toString(), tier: 'GOLD' } },
    ];

    await Transaction.insertMany(txDocs, { ordered: false });
    counters.transactions = txDocs.length;
    console.log(`  ✔  Created ${txDocs.length} transactions`);
  }

  // ── 11. COLLEGE (for CampusDrive) ───────────────────────────────────────────
  console.log('\n━━━  COLLEGE  ━━━');
  const college = await upsertCollege({
    name: 'National Institute of Technology, Mumbai',
    slug: 'nit-mumbai',
    code: 'NITM',
    type: 'ENGINEERING',
    university: 'NIT Mumbai',
    disciplines: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'],
    address: 'Powai, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    phone: '+91-22-12345678',
    website: 'https://nitmumbai.example.com',
    email: 'tpo@nitmumbai.example.com',
    password: 'College@123',
    tpo: { name: 'Prof. Ajay Kumar', email: 'ajay.kumar@nitmumbai.example.com', phone: '+91-9876543210' },
    isActive: true,
    totalDrives: 0,
    totalSelected: 0,
  });

  // ── 12. CAMPUS DRIVES ───────────────────────────────────────────────────────
  console.log('\n━━━  CAMPUS DRIVES  ━━━');

  const existingDrive1 = await CampusDrive.findOne({ title: 'TechNova Campus Recruitment Drive 2025' });
  if (!existingDrive1) {
    await CampusDrive.create({
      college: college._id,
      company: techNova._id,
      createdBy: adminTechNova._id,
      title: 'TechNova Campus Recruitment Drive 2025',
      description: 'TechNova is visiting NIT Mumbai to hire talented engineers for our Mumbai office.',
      driveDate: daysAhead(15),
      venue: 'Auditorium, NIT Mumbai',
      mode: 'OFFLINE',
      jds: [
        {
          role: 'React Developer',
          skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML'],
          stipend: 50000,
          duration: '6 months contract → PPO',
          eligibility: 'B.Tech / M.Tech in CS, IT',
          minCGPA: 7.0,
          eligibleDisciplines: ['Computer Science', 'Information Technology'],
        },
        {
          role: 'Python Developer',
          skills: ['Python', 'Django', 'REST APIs', 'PostgreSQL', 'Docker'],
          stipend: 55000,
          duration: '6 months contract → PPO',
          eligibility: 'B.Tech / M.Tech in CS, IT, Electronics',
          minCGPA: 7.0,
          eligibleDisciplines: ['Computer Science', 'Information Technology', 'Electronics'],
        },
      ],
      status: 'COMPLETED',
      shortlistingCriteria: { minATSScore: 65, minCGPA: 7.0, slots: 15 },
      totalApplicants: 85,
      totalShortlisted: 12,
      totalSelected: 5,
    });
    counters.campusDrives++;
    console.log('  ✔  Created campus drive: TechNova @ NIT Mumbai (COMPLETED)');
  } else {
    console.log('  ↩  Campus drive already exists: TechNova');
  }

  const existingDrive2 = await CampusDrive.findOne({ title: 'DataPulse Analytics Campus Drive 2025' });
  if (!existingDrive2) {
    await CampusDrive.create({
      college: college._id,
      company: dataPulse._id,
      createdBy: adminDataPulse._id,
      title: 'DataPulse Analytics Campus Drive 2025',
      description: 'DataPulse Analytics is recruiting Data Analysts and ML interns from NIT Mumbai.',
      driveDate: daysAhead(30),
      venue: 'Online – Microsoft Teams',
      mode: 'ONLINE',
      jds: [
        {
          role: 'Data Analyst',
          skills: ['Python', 'SQL', 'Tableau', 'Statistics', 'Excel'],
          stipend: 45000,
          duration: '3 months internship → PPO',
          eligibility: 'B.Tech / M.Tech in CS, IT, Mathematics',
          minCGPA: 6.5,
          eligibleDisciplines: ['Computer Science', 'Information Technology', 'Mathematics'],
        },
      ],
      status: 'APPLICATIONS_OPEN',
      shortlistingCriteria: { minATSScore: 60, minCGPA: 6.5, slots: 10 },
      totalApplicants: 42,
      totalShortlisted: 0,
      totalSelected: 0,
    });
    counters.campusDrives++;
    console.log('  ✔  Created campus drive: DataPulse @ NIT Mumbai (APPLICATIONS_OPEN)');
  } else {
    console.log('  ↩  Campus drive already exists: DataPulse');
  }

  // ── ENROLL students in some courses ─────────────────────────────────────────
  console.log('\n━━━  COURSE ENROLLMENTS  ━━━');
  const enrollments = [
    { user: arjun._id,  courses: [course1._id, course5._id] },
    { user: priya._id,  courses: [course2._id, course3._id, course5._id] },
    { user: rahul._id,  courses: [course1._id, course4._id] },
    { user: sneha._id,  courses: [course2._id, course6._id] },
    { user: amit._id,   courses: [course5._id] },
    { user: divya._id,  courses: [course3._id, course5._id, course6._id] },
    { user: karan._id,  courses: [course1._id] },
    { user: ankita._id, courses: [course2._id, course4._id, course6._id] },
  ];
  for (const en of enrollments) {
    await User.updateOne({ _id: en.user }, { $addToSet: { coursesEnrolled: { $each: en.courses } } });
  }
  console.log('  ✔  Enrolled students in courses');

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🌱  SEED COMPLETE – Summary');
  console.log('═'.repeat(60));
  console.log(`  Companies     : ${counters.companies}`);
  console.log(`  Users         : ${counters.users}`);
  console.log(`  Courses       : ${counters.courses}`);
  console.log(`  Listings      : ${counters.listings}`);
  console.log(`  Applications  : ${counters.applications}`);
  console.log(`  Hackathons    : ${counters.hackathons}`);
  console.log(`  Internships   : ${counters.internships}`);
  console.log(`  Transactions  : ${counters.transactions}`);
  console.log(`  Campus Drives : ${counters.campusDrives}`);
  console.log(`  Colleges      : ${counters.colleges}`);
  console.log('═'.repeat(60));
  console.log('\n✅  Database seeded successfully!\n');
}

// ─── Run ────────────────────────────────────────────────────────────────────
seed()
  .catch(err => {
    console.error('\n❌  Seed failed:', err.message || err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());

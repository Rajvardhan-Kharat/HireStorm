// Allow MONGO_URI to be passed as CLI arg: node seedColleges.js mongodb+srv://...
if (process.argv[2]) process.env.MONGO_URI = process.argv[2];
require('dns').setServers(['8.8.8.8', '8.8.4.4']); // force Google DNS
require('dotenv').config();
const mongoose = require('mongoose');
const College = require('./src/models/College');
const connectDB = require('./src/config/db');

// ── Discipline Libraries ──────────────────────────────────────────────────────
const ENG = ['Computer Science','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','Electrical Engineering','Chemical Engineering','Biotechnology','AIDS (AI & Data Science)','EXTC'];
const MGMT = ['MBA - Marketing','MBA - Finance','MBA - Human Resources','MBA - Operations','MBA - Business Analytics','MBA - International Business','MBA - Entrepreneurship'];
const ARTS = ['Economics','English Literature','History','Political Science','Sociology','Psychology','Journalism & Mass Communication','Geography','Philosophy'];
const COMMERCE = ['B.Com General','B.Com (Accounting & Finance)','B.Com (Banking & Insurance)','B.Com (Financial Markets)','Business Management Studies','M.Com'];
const LAW = ['BA LLB (5-Year Integrated)','BBA LLB (5-Year Integrated)','LLB (3-Year)','LLM','Corporate Law','Intellectual Property Law'];
const MEDICAL = ['MBBS','MD - General Medicine','MS - Surgery','B.Sc Nursing','M.Sc Nursing','BDS','BPT (Physiotherapy)','B.Pharm'];
const SCIENCE = ['Physics','Chemistry','Mathematics','Computer Science (B.Sc)','Biotechnology (B.Sc)','Microbiology','Statistics'];
const DESIGN = ['Product Design','Communication Design','Textile Design','Animation','UX Design','Architecture (B.Arch)'];

const colleges = [
  // ── PUNE — Engineering ───────────────────────────────────────────────────
  {
    name:'Pune Institute of Computer Technology', slug:'pict', code:'PICT',
    type:'ENGINEERING', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@pict.edu', password:'PICT@Drive2025',
    address:'Survey No. 27, Dhankawadi, Pune - 411043',
    phone:'+91 20 2437 1101', website:'https://pict.edu',
    tpo:{ name:'Dr. Satish Chikane', email:'tpo@pict.edu', phone:'+91 9876543210' },
    disciplines:['Computer Science','Information Technology','Electronics & Telecommunication','AIDS (AI & Data Science)'],
  },
  {
    name:'College of Engineering Pune', slug:'coep', code:'COEP',
    type:'ENGINEERING', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@coep.org.in', password:'COEP@Drive2025',
    address:'Wellesley Rd, Shivajinagar, Pune - 411005',
    phone:'+91 20 2550 7000', website:'https://coep.org.in',
    tpo:{ name:'Prof. R.K. Patil', email:'tpo@coep.org.in', phone:'+91 9876543211' },
    disciplines:[...ENG],
  },
  {
    name:'Vishwakarma Institute of Technology', slug:'vit-pune', code:'VITPUNE',
    type:'ENGINEERING', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@vit.edu', password:'VIT@Drive2025',
    address:'666, Upper Indiranagar, Bibwewadi, Pune - 411037',
    phone:'+91 20 2440 2800', website:'https://vit.edu',
    tpo:{ name:'Dr. Prashant Kumar', email:'tpo@vit.edu', phone:'+91 9876543212' },
    disciplines:[...ENG],
  },
  {
    name:'MIT World Peace University', slug:'mit-wpu', code:'MITWPU',
    type:'ENGINEERING', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@mitwpu.edu.in', password:'MITWPU@Drive2025',
    address:'Survey No. 124, Paud Road, Kothrud, Pune - 411038',
    phone:'+91 20 7117 7104', website:'https://mitwpu.edu.in',
    tpo:{ name:'Prof. Samir Joshi', email:'tpo@mitwpu.edu.in', phone:'+91 9876543213' },
    disciplines:[...ENG, ...MGMT],
  },
  {
    name:'MIT College of Engineering, Alandi', slug:'mit-alandi', code:'MITALANDI',
    type:'ENGINEERING', university:'SPPU', city:'Alandi', state:'Maharashtra',
    email:'tpo@mitcoe.edu.in', password:'MITALANDI@Drive2025',
    address:'Alandi (D), Pune - 412105',
    phone:'+91 20 2700 0000', website:'https://mitcoe.edu.in',
    tpo:{ name:'Prof. Suresh Patil', email:'tpo@mitcoe.edu.in', phone:'+91 9876543214' },
    disciplines:[...ENG],
  },
  {
    name:'D Y Patil College of Engineering', slug:'dypatil-pune', code:'DYPATIL',
    type:'ENGINEERING', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@dypatilpune.ac.in', password:'DYPATIL@Drive2025',
    address:'Ambi, Talegaon-Dabhade, Pune - 410506',
    phone:'+91 2114 669 100', website:'https://dypatilpune.ac.in',
    tpo:{ name:'Dr. Ashok More', email:'tpo@dypatilpune.ac.in', phone:'+91 9876543216' },
    disciplines:[...ENG],
  },
  {
    name:'Symbiosis Institute of Technology', slug:'sit-pune', code:'SIT',
    type:'ENGINEERING', university:'Symbiosis International University', city:'Pune', state:'Maharashtra',
    email:'tpo@sitpune.edu.in', password:'SIT@Drive2025',
    address:'Gram: Lavale, Tal: Mulshi, Pune - 412115',
    phone:'+91 20 3911 6200', website:'https://sitpune.edu.in',
    tpo:{ name:'Prof. Anita Desai', email:'tpo@sitpune.edu.in', phone:'+91 9876543217' },
    disciplines:['Computer Science','Electronics & Telecommunication','Mechanical Engineering','AIDS (AI & Data Science)','Civil Engineering'],
  },
  // ── PUNE — Management ────────────────────────────────────────────────────
  {
    name:'Symbiosis Institute of Business Management', slug:'sibm-pune', code:'SIBM',
    type:'MANAGEMENT', university:'Symbiosis International University', city:'Pune', state:'Maharashtra',
    email:'tpo@sibmpune.edu.in', password:'SIBM@Drive2025',
    address:'Symbiosis Infotech Campus, Plot No. 15, Rajiv Gandhi IT Park, Hinjewadi, Pune - 411057',
    phone:'+91 20 3911 6200', website:'https://sibmpune.edu.in',
    tpo:{ name:'Prof. Meena Shah', email:'tpo@sibmpune.edu.in', phone:'+91 9876543218' },
    disciplines:[...MGMT],
  },
  // ── PUNE — Arts/Commerce ─────────────────────────────────────────────────
  {
    name:'Fergusson College', slug:'fergusson', code:'FERG',
    type:'ARTS_SCIENCE', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@fergusson.edu', password:'FERG@Drive2025',
    address:'Fergusson College Road, Shivajinagar, Pune - 411004',
    phone:'+91 20 2565 3988', website:'https://fergusson.edu',
    tpo:{ name:'Prof. Rekha More', email:'tpo@fergusson.edu', phone:'+91 9876543219' },
    disciplines:[...ARTS, ...SCIENCE, ...COMMERCE],
  },
  {
    name:'Brihan Maharashtra College of Commerce', slug:'bmcc', code:'BMCC',
    type:'ARTS_SCIENCE', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@bmcc.ac.in', password:'BMCC@Drive2025',
    address:'Shivajinagar, Pune - 411005',
    phone:'+91 20 2553 4427', website:'https://bmcc.ac.in',
    tpo:{ name:'Prof. Vijay Kulkarni', email:'tpo@bmcc.ac.in', phone:'+91 9876543220' },
    disciplines:[...COMMERCE, 'Business Administration (BBA)', 'Computer Applications (BCA)'],
  },
  // ── PUNE — Law ───────────────────────────────────────────────────────────
  {
    name:'ILS Law College', slug:'ils-pune', code:'ILS',
    type:'LAW', university:'SPPU', city:'Pune', state:'Maharashtra',
    email:'tpo@ilslaw.edu', password:'ILS@Drive2025',
    address:'Law College Road, Pune - 411004',
    phone:'+91 20 2565 6775', website:'https://ilslaw.edu',
    tpo:{ name:'Prof. Priya Joshi', email:'tpo@ilslaw.edu', phone:'+91 9876543221' },
    disciplines:[...LAW],
  },
  // ── MUMBAI — Engineering ─────────────────────────────────────────────────
  {
    name:'Sardar Patel Institute of Technology', slug:'spit', code:'SPIT',
    type:'ENGINEERING', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@spit.ac.in', password:'SPIT@Drive2025',
    address:"Bhavans Campus, Munshi Nagar, Andheri (W), Mumbai - 400058",
    phone:'+91 22 2670 3541', website:'https://spit.ac.in',
    tpo:{ name:'Prof. Geeta Mehta', email:'tpo@spit.ac.in', phone:'+91 9876543222' },
    disciplines:['Computer Engineering','Electronics & Telecommunication','Information Technology','Mechanical Engineering'],
  },
  {
    name:"Vivekanand Education Society's Institute of Technology", slug:'vesit', code:'VESIT',
    type:'ENGINEERING', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@vesit.ves.ac.in', password:'VESIT@Drive2025',
    address:'Chembur, Mumbai - 400074',
    phone:'+91 22 2522 0838', website:'https://vesit.ves.ac.in',
    tpo:{ name:'Dr. Nilesh Shah', email:'tpo@vesit.ves.ac.in', phone:'+91 9876543223' },
    disciplines:[...ENG],
  },
  {
    name:'Dwarkadas J. Sanghvi College of Engineering', slug:'djsanghvi', code:'DJSANGHVI',
    type:'ENGINEERING', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@djsanghvi.ac.in', password:'DJSANGHVI@Drive2025',
    address:'Bhaktivedanta Swami Marg, Vile Parle (W), Mumbai - 400056',
    phone:'+91 22 2614 1949', website:'https://djsanghvi.ac.in',
    tpo:{ name:'Prof. Kavita Shah', email:'tpo@djsanghvi.ac.in', phone:'+91 9876543224' },
    disciplines:['Computer Engineering','Electronics & Telecommunication','Information Technology','Mechanical Engineering','AIDS (AI & Data Science)'],
  },
  {
    name:'Veermata Jijabai Technological Institute', slug:'vjti', code:'VJTI',
    type:'ENGINEERING', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@vjti.ac.in', password:'VJTI@Drive2025',
    address:'H R Mahajani Marg, Matunga, Mumbai - 400019',
    phone:'+91 22 2419 8101', website:'https://vjti.ac.in',
    tpo:{ name:'Dr. Rekha Thakur', email:'tpo@vjti.ac.in', phone:'+91 9876543225' },
    disciplines:[...ENG, 'Production Engineering','Textile Technology'],
  },
  {
    name:'K.J. Somaiya College of Engineering', slug:'kjsieit', code:'KJSIEIT',
    type:'ENGINEERING', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@kjsieit.somaiya.edu', password:'KJSIEIT@Drive2025',
    address:'Sion (E), Mumbai - 400022',
    phone:'+91 22 6728 3100', website:'https://kjsieit.somaiya.edu',
    tpo:{ name:'Prof. Rekha Kulkarni', email:'tpo@kjsieit.somaiya.edu', phone:'+91 9876543226' },
    disciplines:[...ENG],
  },
  // ── MUMBAI — Management ──────────────────────────────────────────────────
  {
    name:'Jamnalal Bajaj Institute of Management Studies', slug:'jbims', code:'JBIMS',
    type:'MANAGEMENT', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@jbims.edu', password:'JBIMS@Drive2025',
    address:'164, Backbay Reclamation, Churchgate, Mumbai - 400020',
    phone:'+91 22 2202 1313', website:'https://jbims.edu',
    tpo:{ name:'Prof. Arun Mehta', email:'tpo@jbims.edu', phone:'+91 9876543227' },
    disciplines:[...MGMT],
  },
  {
    name:'S.P. Jain Institute of Management and Research', slug:'spjimr', code:'SPJIMR',
    type:'MANAGEMENT', university:'Autonomous', city:'Mumbai', state:'Maharashtra',
    email:'tpo@spjimr.org', password:'SPJIMR@Drive2025',
    address:'Munshi Nagar, Dadabhai Road, Andheri (W), Mumbai - 400058',
    phone:'+91 22 6629 1515', website:'https://spjimr.org',
    tpo:{ name:'Prof. Sneha Gupta', email:'tpo@spjimr.org', phone:'+91 9876543228' },
    disciplines:[...MGMT, 'PGDM - Global Management','Family Managed Business'],
  },
  // ── MUMBAI — Arts/Commerce ───────────────────────────────────────────────
  {
    name:"St. Xavier's College Mumbai", slug:'xavier-mumbai', code:'XAVIERMUM',
    type:'ARTS_SCIENCE', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@xaviers.edu', password:'XAVIER@Drive2025',
    address:'5, Mahapalika Marg, Mumbai - 400001',
    phone:'+91 22 2262 0661', website:'https://xaviers.edu',
    tpo:{ name:'Prof. Maria Fernandes', email:'tpo@xaviers.edu', phone:'+91 9876543229' },
    disciplines:[...ARTS, ...SCIENCE, ...COMMERCE],
  },
  {
    name:'H.R. College of Commerce & Economics', slug:'hr-college', code:'HRCOLLEGE',
    type:'ARTS_SCIENCE', university:'Mumbai University', city:'Mumbai', state:'Maharashtra',
    email:'tpo@hrcollege.edu', password:'HRCOLLEGE@Drive2025',
    address:'Vidyanagari, Churchgate, Mumbai - 400020',
    phone:'+91 22 2203 5765', website:'https://hrcollege.edu',
    tpo:{ name:'Prof. Sanjay Jain', email:'tpo@hrcollege.edu', phone:'+91 9876543230' },
    disciplines:[...COMMERCE],
  },
  // ── DELHI ────────────────────────────────────────────────────────────────
  {
    name:'Indian Institute of Technology Delhi', slug:'iit-delhi', code:'IITD',
    type:'ENGINEERING', university:'IIT Delhi (Autonomous)', city:'Delhi', state:'Delhi',
    email:'tpo@iitd.ac.in', password:'IITD@Drive2025',
    address:'Hauz Khas, New Delhi - 110016',
    phone:'+91 11 2659 1000', website:'https://iitd.ac.in',
    tpo:{ name:'Prof. Ramesh Kumar', email:'tpo@iitd.ac.in', phone:'+91 9876543231' },
    disciplines:['Computer Science','Electrical Engineering','Mechanical Engineering','Civil Engineering','Chemical Engineering','Mathematics & Computing','Engineering Physics','Biotechnology'],
  },
  {
    name:'Delhi Technological University', slug:'dtu', code:'DTU',
    type:'ENGINEERING', university:'DTU (Autonomous)', city:'Delhi', state:'Delhi',
    email:'tpo@dtu.ac.in', password:'DTU@Drive2025',
    address:'Shahbad Daulatpur, Main Bawana Road, Delhi - 110042',
    phone:'+91 11 2787 1018', website:'https://dtu.ac.in',
    tpo:{ name:'Prof. Anil Sharma', email:'tpo@dtu.ac.in', phone:'+91 9876543232' },
    disciplines:['Computer Science','Electronics & Communication','Electrical Engineering','Mechanical Engineering','Civil Engineering','Biotechnology','Information Technology','Environmental Engineering'],
  },
  {
    name:'Shri Ram College of Commerce', slug:'srcc', code:'SRCC',
    type:'ARTS_SCIENCE', university:'Delhi University', city:'Delhi', state:'Delhi',
    email:'tpo@srcc.du.ac.in', password:'SRCC@Drive2025',
    address:'Maurice Nagar, Delhi - 110007',
    phone:'+91 11 2766 7905', website:'https://srcc.du.ac.in',
    tpo:{ name:'Prof. Kavya Bhatia', email:'tpo@srcc.du.ac.in', phone:'+91 9876543233' },
    disciplines:['B.Com (Hons.)','B.A. (Hons.) Economics','M.Com','MBA - Global Business Operations'],
  },
  {
    name:'Faculty of Management Studies Delhi', slug:'fms-delhi', code:'FMSD',
    type:'MANAGEMENT', university:'Delhi University', city:'Delhi', state:'Delhi',
    email:'tpo@fms.edu', password:'FMSD@Drive2025',
    address:'University Enclave, Delhi - 110007',
    phone:'+91 11 2766 6382', website:'https://fms.edu',
    tpo:{ name:'Prof. Deepak Mehta', email:'tpo@fms.edu', phone:'+91 9876543234' },
    disciplines:[...MGMT],
  },
  // ── BENGALURU ────────────────────────────────────────────────────────────
  {
    name:'R.V. College of Engineering', slug:'rvce', code:'RVCE',
    type:'ENGINEERING', university:'VTU', city:'Bengaluru', state:'Karnataka',
    email:'tpo@rvce.edu.in', password:'RVCE@Drive2025',
    address:'RV Vidyaniketan Post, Mysore Road, Bengaluru - 560059',
    phone:'+91 80 6717 8000', website:'https://rvce.edu.in',
    tpo:{ name:'Prof. Suresh Babu', email:'tpo@rvce.edu.in', phone:'+91 9876543235' },
    disciplines:[...ENG, 'Industrial Engineering & Management'],
  },
  {
    name:'IIM Bengaluru', slug:'iim-bengaluru', code:'IIMB',
    type:'MANAGEMENT', university:'IIM Bengaluru (Autonomous)', city:'Bengaluru', state:'Karnataka',
    email:'tpo@iimb.ac.in', password:'IIMB@Drive2025',
    address:'Bannerghatta Road, Bengaluru - 560076',
    phone:'+91 80 2699 3000', website:'https://iimb.ac.in',
    tpo:{ name:'Prof. Lakshmi Rao', email:'tpo@iimb.ac.in', phone:'+91 9876543236' },
    disciplines:[...MGMT, 'PGPBA - Business Analytics','MBA - Public Policy'],
  },
  {
    name:'National Law School of India University', slug:'nlsiu', code:'NLSIU',
    type:'LAW', university:'NLSIU (Autonomous)', city:'Bengaluru', state:'Karnataka',
    email:'tpo@nls.ac.in', password:'NLSIU@Drive2025',
    address:"Nagarbhavi, Bengaluru - 560072",
    phone:'+91 80 2316 0532', website:'https://nls.ac.in',
    tpo:{ name:'Prof. Arjun Nair', email:'tpo@nls.ac.in', phone:'+91 9876543237' },
    disciplines:[...LAW],
  },
  // ── HYDERABAD ────────────────────────────────────────────────────────────
  {
    name:'IIIT Hyderabad', slug:'iiit-hyd', code:'IIITH',
    type:'ENGINEERING', university:'IIIT Hyderabad (Autonomous)', city:'Hyderabad', state:'Telangana',
    email:'tpo@iiit.ac.in', password:'IIITH@Drive2025',
    address:'Gachibowli, Hyderabad - 500032',
    phone:'+91 40 6653 1000', website:'https://iiit.ac.in',
    tpo:{ name:'Prof. Ravi Kishore', email:'tpo@iiit.ac.in', phone:'+91 9876543238' },
    disciplines:['Computer Science','Electronics & Communication','Computational Linguistics','Cognitive Science','AIDS (AI & Data Science)'],
  },
  {
    name:'Indian School of Business', slug:'isb-hyd', code:'ISB',
    type:'MANAGEMENT', university:'ISB (Autonomous)', city:'Hyderabad', state:'Telangana',
    email:'tpo@isb.edu', password:'ISB@Drive2025',
    address:'Gachibowli, Hyderabad - 500111',
    phone:'+91 40 2318 7000', website:'https://isb.edu',
    tpo:{ name:'Prof. Neha Sharma', email:'tpo@isb.edu', phone:'+91 9876543239' },
    disciplines:['Post Graduate Programme (PGP - MBA)','Executive Education','MBA - Finance','MBA - Strategy & Leadership','MBA - Entrepreneurship','MBA - Marketing'],
  },
  {
    name:'NALSAR University of Law', slug:'nalsar', code:'NALSAR',
    type:'LAW', university:'NALSAR (Autonomous)', city:'Hyderabad', state:'Telangana',
    email:'tpo@nalsar.ac.in', password:'NALSAR@Drive2025',
    address:'Justice City, Shameerpet, Hyderabad - 500101',
    phone:'+91 40 2349 8100', website:'https://nalsar.ac.in',
    tpo:{ name:'Prof. Sunita Reddy', email:'tpo@nalsar.ac.in', phone:'+91 9876543240' },
    disciplines:[...LAW],
  },
  // ── CHENNAI ──────────────────────────────────────────────────────────────
  {
    name:'Indian Institute of Technology Madras', slug:'iit-madras', code:'IITM',
    type:'ENGINEERING', university:'IIT Madras (Autonomous)', city:'Chennai', state:'Tamil Nadu',
    email:'tpo@iitm.ac.in', password:'IITM@Drive2025',
    address:'IIT Post Office, Chennai - 600036',
    phone:'+91 44 2257 8000', website:'https://iitm.ac.in',
    tpo:{ name:'Prof. Venkat Subramanian', email:'tpo@iitm.ac.in', phone:'+91 9876543241' },
    disciplines:['Computer Science','Electrical Engineering','Mechanical Engineering','Civil Engineering','Chemical Engineering','Aerospace Engineering','Ocean Engineering','Biotechnology','Engineering Design','Mathematics'],
  },
  {
    name:'Loyola College Chennai', slug:'loyola-chennai', code:'LOYOLACHEN',
    type:'ARTS_SCIENCE', university:'University of Madras', city:'Chennai', state:'Tamil Nadu',
    email:'tpo@loyolacollege.edu', password:'LOYOLA@Drive2025',
    address:'Nungambakkam, Chennai - 600034',
    phone:'+91 44 2817 8200', website:'https://loyolacollege.edu',
    tpo:{ name:'Fr. Thomas Antony', email:'tpo@loyolacollege.edu', phone:'+91 9876543242' },
    disciplines:[...ARTS, ...SCIENCE, ...COMMERCE, 'BCA','BBA'],
  },
  // ── AHMEDABAD ────────────────────────────────────────────────────────────
  {
    name:'IIM Ahmedabad', slug:'iim-ahmedabad', code:'IIMA',
    type:'MANAGEMENT', university:'IIM Ahmedabad (Autonomous)', city:'Ahmedabad', state:'Gujarat',
    email:'tpo@iima.ac.in', password:'IIMA@Drive2025',
    address:'Vastrapur, Ahmedabad - 380015',
    phone:'+91 79 6632 4000', website:'https://iima.ac.in',
    tpo:{ name:'Prof. Harsh Patel', email:'tpo@iima.ac.in', phone:'+91 9876543243' },
    disciplines:[...MGMT,'PGPX - Executive MBA','MBA - Food & Agribusiness','MBA - Public Policy'],
  },
  {
    name:'National Institute of Design Ahmedabad', slug:'nid-ahmedabad', code:'NID',
    type:'DESIGN', university:'NID (Autonomous)', city:'Ahmedabad', state:'Gujarat',
    email:'tpo@nid.edu', password:'NID@Drive2025',
    address:'Paldi, Ahmedabad - 380007',
    phone:'+91 79 2662 9500', website:'https://nid.edu',
    tpo:{ name:'Prof. Meera Desai', email:'tpo@nid.edu', phone:'+91 9876543244' },
    disciplines:[...DESIGN],
  },
  {
    name:'L.D. College of Engineering', slug:'ldce', code:'LDCE',
    type:'ENGINEERING', university:'Gujarat Technological University', city:'Ahmedabad', state:'Gujarat',
    email:'tpo@ldce.ac.in', password:'LDCE@Drive2025',
    address:'Navrangpura, Ahmedabad - 380015',
    phone:'+91 79 2630 1428', website:'https://ldce.ac.in',
    tpo:{ name:'Prof. Rajesh Shah', email:'tpo@ldce.ac.in', phone:'+91 9876543245' },
    disciplines:[...ENG],
  },
];

async function seedColleges() {
  await connectDB();
  console.log('🌱 Seeding colleges...\n');
  let created = 0, skipped = 0;

  for (const data of colleges) {
    const existing = await College.findOne({ slug: data.slug });
    if (existing) {
      // Update disciplines if changed
      await College.findByIdAndUpdate(existing._id, { disciplines: data.disciplines, type: data.type });
      console.log(`  ♻️  Updated: ${data.name}`);
      skipped++;
      continue;
    }
    const college = new College(data);
    await college.save();
    console.log(`  ✅ Created: ${data.name} [${data.code}] — ${data.city}`);
    created++;
  }

  console.log(`\n🎓 Done! Created: ${created}, Updated: ${skipped}`);
  process.exit(0);
}

seedColleges().catch(err => { console.error(err); process.exit(1); });

const mongoose = require('mongoose');
const College = require('./src/models/College');

const data = {
  'PCCOE': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'AI & Machine Learning'],
  'DYPIOT': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'AI & Data Science', 'Instrumentation Engineering', 'Electrical Engineering'],
  'MMCOE': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Electrical Engineering', 'AI & Data Science'],
  'VIIT': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'AI & Data Science'],
  'COEP': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Instrumentation Engineering', 'Production Engineering', 'Metallurgy'],
  'VITPUNE': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Chemical Engineering', 'Instrumentation Engineering', 'Industrial Engineering', 'AI & Data Science'],
  'PICT': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'AI & Data Science'],
  'SIT': ['Computer Science', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'AI & Data Science', 'Robotics & Automation'],
  'SCOE': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Production Engineering', 'Biotechnology'],
  'DYPCOE': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'AI & Data Science', 'Robotics & Automation'],
  'PCCOER': ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electronics & Telecommunication'],
};

const newColleges = [
  {
    name: 'Cummins College of Engineering for Women', slug: 'cummins', code: 'CCOEW',
    type: 'ENGINEERING', university: 'SPPU', city: 'Pune', state: 'Maharashtra',
    email: 'tpo@cumminscollege.edu', password: 'CCOEW@Drive2025',
    address: 'Karvenagar, Pune - 411052', phone: '+91 20 2531 1000', website: 'https://cumminscollege.org',
    tpo: { name: 'TPO', email: 'tpo@cumminscollege.edu', phone: '+91 9876543230' },
    disciplines: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Instrumentation Engineering']
  },
  {
    name: 'AISSMS College of Engineering', slug: 'aissms-coe', code: 'AISSMSCOE',
    type: 'ENGINEERING', university: 'SPPU', city: 'Pune', state: 'Maharashtra',
    email: 'tpo@aissmscoe.com', password: 'AISSMS@Drive2025',
    address: 'Kennedy Road, Pune - 411001', phone: '+91 20 2605 7660', website: 'https://aissmscoe.com',
    tpo: { name: 'TPO', email: 'tpo@aissmscoe.com', phone: '+91 9876543231' },
    disciplines: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Electrical Engineering', 'Production Engineering']
  },
  {
    name: 'AISSMS Institute of Information Technology', slug: 'aissms-ioit', code: 'AISSMSIOIT',
    type: 'ENGINEERING', university: 'SPPU', city: 'Pune', state: 'Maharashtra',
    email: 'tpo@aissmsioit.org', password: 'AISSMS@Drive2025',
    address: 'Kennedy Road, Pune - 411001', phone: '+91 20 2605 7983', website: 'https://aissmsioit.org',
    tpo: { name: 'TPO', email: 'tpo@aissmsioit.org', phone: '+91 9876543232' },
    disciplines: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Instrumentation Engineering', 'Electrical Engineering', 'AI & Data Science']
  },
  {
    name: 'Modern Education Society\'s College of Engineering', slug: 'mescoe', code: 'MESCOE',
    type: 'ENGINEERING', university: 'SPPU', city: 'Pune', state: 'Maharashtra',
    email: 'tpo@mescoepune.org', password: 'MESCOE@Drive2025',
    address: 'Wadia College Campus, Pune - 411001', phone: '+91 20 2616 3831', website: 'https://mescoepune.org',
    tpo: { name: 'TPO', email: 'tpo@mescoepune.org', phone: '+91 9876543233' },
    disciplines: ['Computer Engineering', 'Electronics & Telecommunication', 'Mechanical Engineering']
  }
];

mongoose.connect('mongodb://localhost:27017/hirestorm').then(async () => {
  try {
    for (const [code, disciplines] of Object.entries(data)) {
      const res = await College.updateOne({ code }, { $set: { disciplines } });
      console.log(`Updated ${code}:`, res.modifiedCount > 0 ? 'Success' : 'No changes');
    }
    for (const c of newColleges) {
      const exists = await College.findOne({ slug: c.slug });
      if (!exists) {
        await College.create(c);
        console.log(`Created new college: ${c.name}`);
      } else {
        await College.updateOne({ slug: c.slug }, { $set: { disciplines: c.disciplines } });
        console.log(`Updated existing new college: ${c.name}`);
      }
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});

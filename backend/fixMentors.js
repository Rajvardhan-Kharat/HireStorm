const mongoose = require('mongoose');
const User = require('./src/models/User');
const Internship = require('./src/models/Internship');

mongoose.connect('mongodb://localhost:27017/hirestorm').then(async () => {
  try {
    const admin = await User.findOne({role: 'SUPER_ADMIN'});
    if(admin) {
      const res = await Internship.updateMany(
        { $or: [{ mentor: { $exists: false } }, { mentor: null }] },
        { $set: { mentor: admin._id } }
      );
      console.log('Fixed mentors to admin:', admin.email, res.modifiedCount);
    } else {
      console.log('No super admin found');
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});

const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/hirestorm').then(async () => {
  try {
    const res = await User.updateOne({role: 'SUPER_ADMIN'}, {$set: {'profile.firstName': 'Sachin', 'profile.lastName': 'Deshpande'}});
    console.log('Updated super admin name to Sachin Deshpande', res.modifiedCount);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});

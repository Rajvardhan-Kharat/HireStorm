const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const admin = await User.findOne({ email: 'admin@hirestorm.com' });
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  try {
    const res = await axios.get('http://localhost:5000/api/v1/ilm/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Error:', e.response ? e.response.status : e.message);
    if(e.response) console.log(e.response.data);
  }
  process.exit(0);
}
run();

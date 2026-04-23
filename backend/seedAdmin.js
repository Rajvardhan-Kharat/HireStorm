const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected.');

    const adminEmail = 'admin@hirestorm.com';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin user already exists!');
      existing.role = 'SUPER_ADMIN';
      existing.isVerified = true;
      existing.password = 'admin123';
      await existing.save();
      console.log('Updated existing user role to SUPER_ADMIN and password to admin123.');
    } else {
      const admin = new User({
        email: adminEmail,
        password: 'admin123',
        role: 'SUPER_ADMIN',
        profile: {
          firstName: 'System',
          lastName: 'Admin'
        },
        isVerified: true,
        isActive: true
      });
      await admin.save();
      console.log('Created new SUPER_ADMIN user.');
    }

    console.log('✅ Admin login credentials:');
    console.log('Email: admin@hirestorm.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();

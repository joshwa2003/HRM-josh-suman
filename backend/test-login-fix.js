const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testAndFixLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/hrm_system');
    console.log('✅ Connected to MongoDB');
    
    const email = 'employee@company.com';
    const password = 'password123';
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.firstName, user.lastName);
    console.log('📧 Email:', user.email);
    console.log('🔑 Role:', user.role);
    console.log('✅ Active:', user.isActive);
    
    // Fix isActive if needed
    if (!user.isActive) {
      console.log('🔧 Fixing: Setting user as active...');
      await User.updateOne({ email: email.toLowerCase() }, { isActive: true });
      console.log('✅ User activated');
    }
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('🔧 Fixing: Resetting password...');
      const hashedPassword = await bcrypt.hash(password, 12);
      await User.updateOne({ email: email.toLowerCase() }, { password: hashedPassword });
      console.log('✅ Password reset');
    }
    
    // Test JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    console.log('🔑 JWT Secret exists:', !!jwtSecret);
    
    try {
      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
      console.log('✅ JWT token generated successfully');
    } catch (jwtError) {
      console.log('❌ JWT error:', jwtError.message);
    }
    
    // Final test - simulate login
    console.log('\n🧪 Testing login simulation...');
    const finalUser = await User.findOne({ email: email.toLowerCase() });
    const finalPasswordCheck = await bcrypt.compare(password, finalUser.password);
    
    if (finalUser && finalUser.isActive && finalPasswordCheck) {
      console.log('🎉 LOGIN SHOULD WORK NOW!');
    } else {
      console.log('❌ Login still has issues:');
      console.log('  - User exists:', !!finalUser);
      console.log('  - User active:', finalUser?.isActive);
      console.log('  - Password valid:', finalPasswordCheck);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testAndFixLogin();

// Simple script to update work hours to 11:40 AM - 11:50 AM
// Run this with: node backend/update-work-hours.js

const mongoose = require('mongoose');
const SystemSettings = require('./models/SystemSettings');
require('dotenv').config();

async function updateWorkHours() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update work hours settings
    const updates = [
      {
        key: 'work_hours_checkin',
        value: '03:40',
        description: 'Standard check-in time - 03:40 PM (24-hour format)',
        category: 'attendance'
      },
      {
        key: 'work_hours_checkout',
        value: '03:50',
        description: 'Standard check-out time - 03:50 PM (24-hour format)',
        category: 'attendance'
      },
      {
        key: 'daily_working_hours',
        value: 0.167,
        description: 'Required daily working hours (10 minutes = 0.167 hours)',
        category: 'attendance'
      }
    ];

    console.log('🔄 Updating work hours settings...');
    
    for (const setting of updates) {
      await SystemSettings.setSetting(
        setting.key,
        setting.value,
        setting.description,
        setting.category
      );
      console.log(`✅ Updated: ${setting.key} = ${setting.value}`);
    }

    // Verify the changes
    console.log('\n📋 Verifying new work hours:');
    const workHours = await SystemSettings.getWorkHours();
    console.log('- Check-in Time:', workHours.checkInTime);
    console.log('- Check-out Time:', workHours.checkOutTime);
    console.log('- Working Hours:', workHours.workingHours);

    console.log('\n🎉 SUCCESS! Work hours updated to:');
    console.log('   Check-in: 03:40 PM');
    console.log('   Check-out: 03:50 PM');
    console.log('   Duration: 10 minutes');
    console.log('\n✅ Your HRM system is now configured correctly!');
    
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error updating work hours:', error.message);
    process.exit(1);
  }
}

updateWorkHours();

const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');

async function debugLateCalculation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_system');
    console.log('MongoDB connected successfully');

    // Get work hours settings
    const workHours = await SystemSettings.getWorkHours();
    console.log('\n=== CURRENT WORK HOURS SETTINGS ===');
    console.log('Check-in time:', workHours.checkInTime);
    console.log('Check-out time:', workHours.checkOutTime);
    console.log('Working hours:', workHours.workingHours);

    // Find the employee
    const employee = await User.findOne({ email: 'employee@company.com' });
    if (!employee) {
      console.log('Employee not found');
      return;
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (attendance) {
      console.log('\n=== CURRENT ATTENDANCE RECORD ===');
      console.log('Check-in:', attendance.checkIn);
      console.log('Check-out:', attendance.checkOut);
      console.log('Is Late:', attendance.isLate);
      console.log('Late Minutes:', attendance.lateMinutes);
      console.log('Total Hours:', attendance.totalHours);
      console.log('Status:', attendance.status);

      // Manual calculation
      console.log('\n=== MANUAL CALCULATION ===');
      const [checkInHour, checkInMinute] = workHours.checkInTime.split(':').map(Number);
      const standardCheckIn = new Date(attendance.date);
      standardCheckIn.setHours(checkInHour, checkInMinute, 0, 0);
      
      console.log('Standard check-in time:', standardCheckIn);
      console.log('Actual check-in time:', attendance.checkIn);
      
      const timeDiff = attendance.checkIn.getTime() - standardCheckIn.getTime();
      const calculatedLateMinutes = Math.floor(timeDiff / (1000 * 60));
      
      console.log('Time difference (ms):', timeDiff);
      console.log('Calculated late minutes:', calculatedLateMinutes);
      console.log('Stored late minutes:', attendance.lateMinutes);
      
      if (calculatedLateMinutes !== attendance.lateMinutes) {
        console.log('\n❌ MISMATCH DETECTED!');
        console.log('Expected:', calculatedLateMinutes, 'minutes');
        console.log('Actual:', attendance.lateMinutes, 'minutes');
        
        // Fix the record
        attendance.lateMinutes = calculatedLateMinutes;
        attendance.isLate = calculatedLateMinutes > 0;
        await attendance.save();
        console.log('✅ Fixed the attendance record');
      } else {
        console.log('✅ Calculation is correct');
      }
    } else {
      console.log('No attendance record found for today');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

debugLateCalculation();

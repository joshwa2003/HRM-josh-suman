const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const SystemSettings = require('./models/SystemSettings');

async function testAttendanceLogic() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hrm_system');
    console.log('Connected to MongoDB');

    // Get current work hours
    const workHours = await SystemSettings.getWorkHours();
    console.log('\n=== Current Work Hours Settings ===');
    console.log('Check-in Time:', workHours.checkInTime);
    console.log('Check-out Time:', workHours.checkOutTime);
    console.log('Working Hours:', workHours.workingHours);

    // Find a test employee
    const employee = await User.findOne({ role: { $ne: 'Admin' } });
    if (!employee) {
      console.log('No employee found for testing');
      return;
    }

    console.log('\n=== Testing Employee ===');
    console.log('Name:', employee.firstName, employee.lastName);
    console.log('Email:', employee.email);

    // Clear today's attendance for testing
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Attendance.deleteMany({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow }
    });

    console.log('\n=== Test Scenarios ===');

    // Scenario 1: On-time check-in (within 59 seconds)
    console.log('\n1. Testing ON-TIME check-in (within 59 seconds)');
    const onTimeCheckIn = new Date();
    onTimeCheckIn.setHours(13, 0, 30, 0); // 1:00:30 PM (30 seconds after standard time)

    const attendance1 = new Attendance({
      employee: employee._id,
      date: today,
      checkIn: onTimeCheckIn,
      location: 'Office'
    });

    await attendance1.save();
    console.log('Check-in time:', onTimeCheckIn.toLocaleTimeString());
    console.log('Is Late:', attendance1.isLate);
    console.log('Late Minutes:', attendance1.lateMinutes);
    console.log('Status:', attendance1.status);
    console.log('Overtime:', attendance1.overtime);

    // Clean up
    await Attendance.deleteOne({ _id: attendance1._id });

    // Scenario 2: Late check-in (more than 59 seconds)
    console.log('\n2. Testing LATE check-in (more than 59 seconds)');
    const lateCheckIn = new Date();
    lateCheckIn.setHours(13, 1, 30, 0); // 1:01:30 PM (1 minute 30 seconds late)

    const attendance2 = new Attendance({
      employee: employee._id,
      date: today,
      checkIn: lateCheckIn,
      location: 'Office'
    });

    await attendance2.save();
    console.log('Check-in time:', lateCheckIn.toLocaleTimeString());
    console.log('Is Late:', attendance2.isLate);
    console.log('Late Minutes:', attendance2.lateMinutes);
    console.log('Status:', attendance2.status);
    console.log('Overtime:', attendance2.overtime);

    // Clean up
    await Attendance.deleteOne({ _id: attendance2._id });

    // Scenario 3: Early check-in (overtime)
    console.log('\n3. Testing EARLY check-in (overtime)');
    const earlyCheckIn = new Date();
    earlyCheckIn.setHours(12, 45, 0, 0); // 12:45 PM (15 minutes early)

    const attendance3 = new Attendance({
      employee: employee._id,
      date: today,
      checkIn: earlyCheckIn,
      location: 'Office'
    });

    await attendance3.save();
    console.log('Check-in time:', earlyCheckIn.toLocaleTimeString());
    console.log('Is Late:', attendance3.isLate);
    console.log('Late Minutes:', attendance3.lateMinutes);
    console.log('Status:', attendance3.status);
    console.log('Overtime:', attendance3.overtime, 'hours');

    // Clean up
    await Attendance.deleteOne({ _id: attendance3._id });

    // Scenario 4: Complete attendance with overtime
    console.log('\n4. Testing COMPLETE attendance with early check-in and late check-out');
    const earlyCheckInComplete = new Date();
    earlyCheckInComplete.setHours(12, 50, 0, 0); // 12:50 PM (10 minutes early)

    const lateCheckOut = new Date();
    lateCheckOut.setHours(13, 15, 0, 0); // 1:15 PM (5 minutes late)

    const attendance4 = new Attendance({
      employee: employee._id,
      date: today,
      checkIn: earlyCheckInComplete,
      checkOut: lateCheckOut,
      location: 'Office'
    });

    await attendance4.save();
    console.log('Check-in time:', earlyCheckInComplete.toLocaleTimeString());
    console.log('Check-out time:', lateCheckOut.toLocaleTimeString());
    console.log('Is Late:', attendance4.isLate);
    console.log('Late Minutes:', attendance4.lateMinutes);
    console.log('Total Hours:', attendance4.totalHours);
    console.log('Status:', attendance4.status);
    console.log('Overtime:', attendance4.overtime, 'hours');

    // Clean up
    await Attendance.deleteOne({ _id: attendance4._id });

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAttendanceLogic();

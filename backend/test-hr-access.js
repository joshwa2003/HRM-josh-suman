const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hrm-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testHRAccess() {
  try {
    console.log('Testing HR BP access to attendance data...\n');

    // Find an HR BP user
    const hrUser = await User.findOne({ role: 'HR BP' });
    if (!hrUser) {
      console.log('❌ No HR BP user found. Creating one for testing...');
      
      const newHRUser = new User({
        email: 'hr.bp@company.com',
        password: 'password123',
        firstName: 'HR',
        lastName: 'BP User',
        role: 'HR BP'
      });
      
      await newHRUser.save();
      console.log('✅ Created HR BP user for testing');
      return;
    }

    console.log(`Found HR BP user: ${hrUser.firstName} ${hrUser.lastName} (${hrUser.email})`);
    console.log(`Role level: ${hrUser.getRoleLevel()}`);

    // Test the permission logic
    const currentUserLevel = hrUser.getRoleLevel();
    const userRole = hrUser.role;
    
    const canViewAllAttendance = currentUserLevel <= 2 || 
                                userRole.startsWith('HR') || 
                                ['HR BP', 'HR Manager', 'HR Executive'].includes(userRole);

    console.log('\n=== Permission Check ===');
    console.log(`User Level: ${currentUserLevel}`);
    console.log(`User Role: ${userRole}`);
    console.log(`Role starts with HR: ${userRole.startsWith('HR')}`);
    console.log(`Role in HR list: ${['HR BP', 'HR Manager', 'HR Executive'].includes(userRole)}`);
    console.log(`Can view all attendance: ${canViewAllAttendance}`);

    if (canViewAllAttendance) {
      console.log('\n✅ HR BP should be able to access all attendance records');
      
      // Test actual attendance query
      const attendanceRecords = await Attendance.find({})
        .populate('employee', 'firstName lastName email role')
        .limit(5);
      
      console.log(`\n📊 Found ${attendanceRecords.length} attendance records:`);
      attendanceRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.employee?.firstName} ${record.employee?.lastName} - ${record.status} (${new Date(record.date).toDateString()})`);
      });
    } else {
      console.log('\n❌ HR BP cannot access all attendance records - Permission logic needs fixing');
    }

  } catch (error) {
    console.error('Error testing HR access:', error);
  } finally {
    mongoose.connection.close();
  }
}

testHRAccess();

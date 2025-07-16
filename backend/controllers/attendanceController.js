const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Check in employee
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { location = 'Office', notes } = req.body;
    const userId = req.user._id;
    
    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const device = req.get('User-Agent');

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let attendance = await Attendance.findOne({
      employee: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        message: 'You have already checked in today',
        attendance: attendance
      });
    }

    // Create or update attendance record
    if (!attendance) {
      attendance = new Attendance({
        employee: userId,
        date: today,
        checkIn: new Date(),
        location,
        ipAddress,
        device,
        notes,
        createdBy: userId
      });
    } else {
      attendance.checkIn = new Date();
      attendance.location = location;
      attendance.ipAddress = ipAddress;
      attendance.device = device;
      attendance.notes = notes;
      attendance.updatedBy = userId;
    }

    await attendance.save();

    // Populate employee details
    await attendance.populate('employee', 'firstName lastName email role department');

    // Prepare response with late arrival information
    const response = {
      message: 'Check-in successful',
      attendance: attendance,
      isLateArrival: attendance.isLate,
      lateMinutes: attendance.lateMinutes
    };

    res.json(response);

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      message: 'Server error during check-in',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Check out employee
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notes } = req.body;
    const userId = req.user._id;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        message: 'No check-in record found for today. Please check in first.'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: 'You have already checked out today',
        attendance: attendance
      });
    }

    // Update attendance with check-out time
    attendance.checkOut = new Date();
    if (notes) attendance.notes = notes;
    attendance.updatedBy = userId;

    await attendance.save();

    // Populate employee details
    await attendance.populate('employee', 'firstName lastName email role department');

    res.json({
      message: 'Check-out successful',
      attendance: attendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      message: 'Server error during check-out',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get current user's attendance records
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, month, year } = req.query;

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = { date: { $gte: startDate, $lte: endDate } };
    }

    const attendance = await Attendance.find({
      employee: userId,
      ...dateFilter
    })
    .populate('employee', 'firstName lastName email role department')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Attendance.countDocuments({
      employee: userId,
      ...dateFilter
    });

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      message: 'Server error fetching attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get today's attendance for current user
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: { $gte: today, $lt: tomorrow }
    }).populate('employee', 'firstName lastName email role department');

    res.json({
      attendance: attendance || null
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      message: 'Server error fetching today\'s attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get attendance summary for current user
// @route   GET /api/attendance/summary
// @access  Private
const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    const summary = await Attendance.getMonthlySummary(userId, parseInt(year), parseInt(month));

    res.json({
      summary,
      month: parseInt(month),
      year: parseInt(year)
    });

  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      message: 'Server error fetching attendance summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all attendance records (Admin/HR/Manager access)
// @route   GET /api/attendance
// @access  Private
const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, employee, department, status, startDate, endDate } = req.query;

    // Build filter
    let filter = {};
    
    if (employee) {
      filter.employee = employee;
    }
    
    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // If user is not admin/HR, filter by department or team
    const currentUserLevel = req.user.getRoleLevel();
    const userRole = req.user.role;
    
    // Allow Admin, VP, and all HR roles to see all attendance records
    const canViewAllAttendance = currentUserLevel <= 2 || 
                                userRole.startsWith('HR') || 
                                ['HR BP', 'HR Manager', 'HR Executive'].includes(userRole);
    
    if (!canViewAllAttendance) {
      const userDepartment = req.user.department;
      if (userDepartment) {
        // Get users in same department
        const departmentUsers = await User.find({ department: userDepartment }).select('_id');
        filter.employee = { $in: departmentUsers.map(u => u._id) };
      }
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName email role department')
      .populate('regularizedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      message: 'Server error fetching attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('employee', 'firstName lastName email role department')
      .populate('regularizedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if user can access this record
    const currentUserLevel = req.user.getRoleLevel();
    const userRole = req.user.role;
    const isOwnRecord = attendance.employee._id.toString() === req.user._id.toString();
    
    // Allow Admin, VP, and all HR roles to view all attendance records
    const canViewAllAttendance = currentUserLevel <= 2 || 
                                userRole.startsWith('HR') || 
                                ['HR BP', 'HR Manager', 'HR Executive'].includes(userRole);
    
    if (!isOwnRecord && !canViewAllAttendance) {
      // Check if same department
      if (attendance.employee.department?.toString() !== req.user.department?.toString()) {
        return res.status(403).json({
          message: 'Access denied. Cannot view attendance from different department.'
        });
      }
    }

    res.json({ attendance });

  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching attendance record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Admin/HR/Manager)
const updateAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const { checkIn, checkOut, status, location, notes } = req.body;

    // Update fields
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (status) attendance.status = status;
    if (location) attendance.location = location;
    if (notes) attendance.notes = notes;
    
    attendance.updatedBy = req.user._id;

    await attendance.save();

    await attendance.populate('employee', 'firstName lastName email role department');

    res.json({
      message: 'Attendance record updated successfully',
      attendance
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      message: 'Server error updating attendance record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Regularize attendance record
// @route   POST /api/attendance/:id/regularize
// @access  Private (Admin/HR/Manager)
const regularizeAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const { reason, checkIn, checkOut } = req.body;

    await attendance.regularize(
      req.user._id,
      reason,
      checkIn ? new Date(checkIn) : null,
      checkOut ? new Date(checkOut) : null
    );

    await attendance.populate('employee', 'firstName lastName email role department');
    await attendance.populate('regularizedBy', 'firstName lastName');

    res.json({
      message: 'Attendance regularized successfully',
      attendance
    });

  } catch (error) {
    console.error('Regularize attendance error:', error);
    res.status(500).json({
      message: 'Server error regularizing attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  regularizeAttendance,
  getAttendanceSummary,
  getTodayAttendance
};

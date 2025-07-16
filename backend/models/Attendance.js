
const mongoose = require('mongoose');
const SystemSettings = require('./SystemSettings');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  breakTime: {
    start: Date,
    end: Date,
    duration: {
      type: Number, // in minutes
      default: 0
    }
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday'],
    default: 'Absent'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  isEarly: {
    type: Boolean,
    default: false
  },
  earlyMinutes: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    enum: ['Office', 'Remote', 'Client Site'],
    default: 'Office'
  },
  ipAddress: {
    type: String
  },
  device: {
    type: String
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  isRegularized: {
    type: Boolean,
    default: false
  },
  regularizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  regularizedDate: {
    type: Date
  },
  regularizationReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for employee and date uniqueness
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ isLate: 1 });

// Pre-save middleware to calculate total hours and status
attendanceSchema.pre('save', async function(next) {
  // Get work hours from system settings
  const workHours = await SystemSettings.getWorkHours();
  const [checkInHour, checkInMinute] = workHours.checkInTime.split(':').map(Number);
  const [checkOutHour, checkOutMinute] = workHours.checkOutTime.split(':').map(Number);
  const dailyWorkingHours = workHours.workingHours;
  
  // Check for late arrival if check-in is present
  if (this.checkIn) {
    // Create standard check-in time for the same date as the actual check-in
    const checkInDate = new Date(this.checkIn);
    const standardCheckIn = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    standardCheckIn.setHours(checkInHour, checkInMinute, 0, 0);
    
    // Calculate time difference in seconds for precise calculation
    const timeDiffMs = this.checkIn.getTime() - standardCheckIn.getTime();
    const timeDiffSeconds = timeDiffMs / 1000;
    
    if (timeDiffSeconds > 59) {
      // Check-in is more than 59 seconds after standard time - LATE
      this.isLate = true;
      this.lateMinutes = Math.floor(timeDiffSeconds / 60);
    } else {
      // Check-in is within 59 seconds of standard time OR early - NOT LATE
      this.isLate = false;
      this.lateMinutes = 0;
    }
  }
  
  // Calculate total hours and other metrics if both check-in and check-out are present
  if (this.checkIn && this.checkOut) {
    // Calculate total hours
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    let totalMinutes = Math.floor(timeDiff / (1000 * 60));
    
    // Subtract break time
    if (this.breakTime && this.breakTime.duration) {
      totalMinutes -= this.breakTime.duration;
    }
    
    this.totalHours = Math.max(0, totalMinutes / 60);
    
    // Determine status based on configurable working hours
    if (this.totalHours >= dailyWorkingHours) {
      // If employee worked required hours, they are Present
      // But keep Late status if they arrived late (dual status)
      this.status = 'Present';
    } else if (this.totalHours >= dailyWorkingHours / 2) {
      this.status = 'Half Day';
    } else {
      this.status = 'Absent';
    }
    
    // Note: isLate flag remains true if they arrived late, regardless of status
    // This allows tracking both Present days and Late days in monthly summary
    
    // Check for early departure using configurable check-out time
    const checkOutDate = new Date(this.checkOut);
    const standardCheckOutForEarly = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    standardCheckOutForEarly.setHours(checkOutHour, checkOutMinute, 0, 0);
    
    if (this.checkOut < standardCheckOutForEarly) {
      this.isEarly = true;
      this.earlyMinutes = Math.floor((standardCheckOutForEarly.getTime() - this.checkOut.getTime()) / (1000 * 60));
    } else {
      this.isEarly = false;
      this.earlyMinutes = 0;
    }
    
    // Calculate overtime based on user requirements:
    // 1. Early check-in: time before standard check-in = overtime
    // 2. Late check-out: time after standard check-out = overtime
    // 3. Late check-in: NO overtime (just marked as late)
    let overtimeMinutes = 0;
    
    // Use actual check-in date for standard times
    const checkInDate = new Date(this.checkIn);
    const standardCheckInTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    standardCheckInTime.setHours(checkInHour, checkInMinute, 0, 0);
    
    const checkOutDateForOvertime = new Date(this.checkOut);
    const standardCheckOutTime = new Date(checkOutDateForOvertime.getFullYear(), checkOutDateForOvertime.getMonth(), checkOutDateForOvertime.getDate());
    standardCheckOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);
    
    // Early check-in overtime (ONLY if check-in is before standard time)
    if (this.checkIn < standardCheckInTime) {
      const earlyMinutes = Math.floor((standardCheckInTime.getTime() - this.checkIn.getTime()) / (1000 * 60));
      // Allow up to 24 hours early for valid same-day scenarios
      if (earlyMinutes > 0 && earlyMinutes < 1440) {
        overtimeMinutes += earlyMinutes;
      }
    }
    
    // Late check-out overtime (ONLY if check-out is after standard time)
    if (this.checkOut > standardCheckOutTime) {
      const lateCheckOutMinutes = Math.floor((this.checkOut.getTime() - standardCheckOutTime.getTime()) / (1000 * 60));
      // Allow up to 24 hours late for valid scenarios
      if (lateCheckOutMinutes > 0 && lateCheckOutMinutes < 1440) {
        overtimeMinutes += lateCheckOutMinutes;
      }
    }
    
    this.overtime = overtimeMinutes / 60; // Convert to hours
  } else if (this.checkIn && !this.checkOut) {
    // If only check-in is present, set initial status
    if (this.isLate && this.lateMinutes > 30) {
      this.status = 'Late';
    } else {
      this.status = 'Present'; // Temporary status until check-out
    }
    
    // Calculate early check-in overtime for incomplete records
    // Use actual check-in date for standard time calculation
    const checkInDate = new Date(this.checkIn);
    const standardCheckIn = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    standardCheckIn.setHours(checkInHour, checkInMinute, 0, 0);
    
    if (this.checkIn < standardCheckIn) {
      // Calculate early minutes correctly
      const earlyMinutes = Math.floor((standardCheckIn.getTime() - this.checkIn.getTime()) / (1000 * 60));
      // Allow up to 24 hours early (1440 minutes) for valid same-day scenarios
      if (earlyMinutes > 0 && earlyMinutes < 1440) {
        this.overtime = Math.round((earlyMinutes / 60) * 100) / 100; // Convert to hours and round to 2 decimal places
      } else {
        this.overtime = 0;
      }
    } else {
      this.overtime = 0;
    }
  }
  
  next();
});

// Method to mark check-in
attendanceSchema.methods.checkInEmployee = function(location = 'Office', ipAddress, device) {
  this.checkIn = new Date();
  this.location = location;
  this.ipAddress = ipAddress;
  this.device = device;
  return this.save();
};

// Method to mark check-out
attendanceSchema.methods.checkOutEmployee = function() {
  this.checkOut = new Date();
  return this.save();
};

// Method to regularize attendance
attendanceSchema.methods.regularize = function(regularizedBy, reason, checkIn, checkOut) {
  this.isRegularized = true;
  this.regularizedBy = regularizedBy;
  this.regularizedDate = new Date();
  this.regularizationReason = reason;
  this.updatedBy = regularizedBy;
  
  if (checkIn) this.checkIn = checkIn;
  if (checkOut) this.checkOut = checkOut;
  
  return this.save();
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const attendance = await this.find({
    employee: userId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  // Calculate total hours including current work hours for incomplete records
  let totalHours = 0;
  const now = new Date();
  
  attendance.forEach(record => {
    if (record.checkIn && record.checkOut) {
      // For completed records, use the calculated totalHours
      totalHours += record.totalHours || 0;
    } else if (record.checkIn && !record.checkOut) {
      // Calculate current work hours for incomplete records using same logic as frontend
      const timeDiff = now.getTime() - record.checkIn.getTime();
      const totalMinutes = Math.floor(timeDiff / (1000 * 60));
      
      if (totalMinutes > 0) {
        const currentHours = totalMinutes / 60;
        totalHours += currentHours;
      }
    }
  });
  
  const summary = {
    totalDays: attendance.length,
    presentDays: attendance.filter(a => a.status === 'Present').length,
    absentDays: attendance.filter(a => a.status === 'Absent').length,
    lateDays: attendance.filter(a => a.isLate).length,
    halfDays: attendance.filter(a => a.status === 'Half Day').length,
    totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
    overtimeHours: Math.round(attendance.reduce((sum, a) => sum + (a.overtime || 0), 0) * 100) / 100
  };
  
  return summary;
};

// Transform output
attendanceSchema.methods.toJSON = function() {
  const attendanceObject = this.toObject();
  return attendanceObject;
};

module.exports = mongoose.model('Attendance', attendanceSchema);

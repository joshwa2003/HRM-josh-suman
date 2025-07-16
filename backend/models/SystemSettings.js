const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['attendance', 'general', 'notifications', 'security'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
systemSettingsSchema.index({ settingKey: 1 });
systemSettingsSchema.index({ category: 1 });

// Static method to get setting value
systemSettingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  const setting = await this.findOne({ settingKey: key, isActive: true });
  return setting ? setting.settingValue : defaultValue;
};

// Static method to set setting value
systemSettingsSchema.statics.setSetting = async function(key, value, description, category = 'general', updatedBy = null) {
  const setting = await this.findOneAndUpdate(
    { settingKey: key },
    {
      settingValue: value,
      description,
      category,
      updatedBy,
      isActive: true
    },
    { upsert: true, new: true }
  );
  return setting;
};

// Static method to get work hours
systemSettingsSchema.statics.getWorkHours = async function() {
  const checkInTime = await this.getSetting('work_hours_checkin', '09:15');
  const checkOutTime = await this.getSetting('work_hours_checkout', '09:30');
  const workingHours = await this.getSetting('daily_working_hours', 0.25);
  
  return {
    checkInTime,
    checkOutTime,
    workingHours
  };
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Get all users (Admin, VP, HR roles, Team Leaders, Team Managers)
// @route   GET /api/users
// @access  Private (Admin, VP, HR BP, HR Manager, HR Executive, Team Manager, Team Leader)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, search } = req.query;
    
    // Build query
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (department) {
      query.department = new RegExp(department, 'i');
    }
    
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'firstName lastName email')
      .populate('department', 'name');  // Populate department name

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if current user can view this user
    const currentUserLevel = req.user.getRoleLevel();
    const targetUserLevel = user.getRoleLevel();

    // Users can view their own profile or users with lower authority
    if (req.user._id.toString() !== user._id.toString() && currentUserLevel > targetUserLevel) {
      return res.status(403).json({
        message: 'Access denied. Cannot view user with higher authority.'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      role,
      department,
      employeeId,
      phoneNumber,
      dateOfBirth,
      gender,
      joiningDate,
      designation,
      employmentType,
      reportingManager,
      workLocation,
      isActive
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({
          message: 'Employee ID already exists'
        });
      }
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      middleName,
      lastName,
      role,
      department,
      employeeId,
      phoneNumber,
      dateOfBirth,
      gender,
      joiningDate,
      designation,
      employmentType,
      reportingManager,
      workLocation,
      isActive,
      createdBy: req.user._id
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: messages
      });
    }
    res.status(500).json({
      message: 'Server error while creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check permissions
    const currentUserLevel = req.user.getRoleLevel();
    const targetUserLevel = user.getRoleLevel();

    // Users can only update their own profile or users with lower authority
    if (req.user._id.toString() !== user._id.toString() && currentUserLevel >= targetUserLevel) {
      return res.status(403).json({
        message: 'Access denied. Cannot update user with equal or higher authority.'
      });
    }

    const {
      firstName,
      lastName,
      department,
      phoneNumber,
      role,
      isActive
    } = req.body;

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (department) user.department = department;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Only admins can change roles and active status
    if (req.user.role === 'Admin') {
      if (role) user.role = role;
      if (typeof isActive === 'boolean') user.isActive = isActive;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Server error while updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all roles
// @route   GET /api/users/roles
// @access  Private
const getRoles = async (req, res) => {
  try {
    const roles = User.getRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      message: 'Server error while fetching roles'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  getRoles
};

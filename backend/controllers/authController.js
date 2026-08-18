const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: '7d',
  });
};

// Register user (Firebase authenticated)
exports.register = async (req, res) => {
  try {
    const { firebaseUid, email, name, gender, age, studyingIn } = req.body;

    // Validate input
    if (!firebaseUid || !email) {
      return res.status(400).json({ message: 'Firebase UID and email are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    
    if (user) {
      // User already registered, return existing user
      const token = generateToken(user._id);
      return res.status(200).json({
        message: 'User already registered',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          firebaseUid: user.firebaseUid,
        },
      });
    }

    // Create new user in MongoDB
    user = await User.create({
      firebaseUid,
      name: name || email.split('@')[0],
      email,
      gender: gender || '',
      age: age || null,
      studyingIn: studyingIn || '',
    });

    console.log('✅ User registered in MongoDB:', user._id, email);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating account' });
  }
};

// Login user (Firebase authenticated)
exports.login = async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;

    // Validate input
    if (!firebaseUid) {
      return res.status(400).json({ message: 'Firebase UID is required' });
    }

    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // Check by email if firebaseUid wasn't found
      if (email) {
        user = await User.findOne({ email });
        if (user) {
          user.firebaseUid = firebaseUid;
          await user.save();
          console.log('✅ Updated existing user with new Firebase UID:', user._id);
        }
      }

      if (!user) {
        // If user doesn't exist, create one (first login scenario)
        user = await User.create({
          firebaseUid,
          email: email || 'unknown@firebase.com',
          name: email ? email.split('@')[0] : 'User',
        });
        console.log('✅ New user created on first login:', user._id, email);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, gender, age, studyingIn } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`\n✏️ Update Profile Request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Updates: name, gender, age, studyingIn`);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(gender && { gender }),
        ...(age !== undefined && { age }),
        ...(studyingIn && { studyingIn }),
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ Profile updated:`, user._id);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: user.age,
        studyingIn: user.studyingIn,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile: ' + error.message });
  }
};
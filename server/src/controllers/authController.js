import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    //1. check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields",
        success: false,
      });
    }
    //2. check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
      });
    }
    //3. create new user
    const user = await User.create({
      name,
      email,
      password,
    });
    //4. generate token
    generateToken(res, user._id);
    //5. send response

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // handle duplicate key error for email
    if (error.code == 11000) {
      return res.status(400).json({
        message: "Email already exists",
        success: false,
      });
    }
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// @desc   Login a user
// @troute POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //1. check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields",
        success: false,
      });
    }
    // 2.  check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }
    //3. compare password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }
    //4 generate token
    generateToken(res, user._id);
    //5. send response
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error:",
      success: false,
    });
  }
};

// @desc   Logout a user
// @troute POST /api/auth/logout
// @access Public
export const logout = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    message: "User logged out successfully",
    success: true,
  });
};

// @desc   Get user profile
//  @route GET /api/auth/me
// @access Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

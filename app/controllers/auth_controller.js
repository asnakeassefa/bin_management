import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import { User } from "../models/index.js";
import config from "../config/config.js";
import { 
    successResponse, 
    errorResponse, 
    createdResponse, 
    unauthorizedResponse, 
    badRequestResponse 
} from "../utils/responseHandler.js";
import { UK_COUNTRIES } from '../validations/country_schemas.js';

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, tokenType: "access" },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );

  const refreshToken = jwt.sign(
    { userId, tokenType: "refresh" },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { accessToken, refreshToken };
};

// Login controller
export async function login(req, res) {
  const { email, password, deviceToken } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return unauthorizedResponse(res, "Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return unauthorizedResponse(res, "Invalid credentials");
    }

    // Generate both tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Update user with new device token and refresh token
    const updateData = {
      refreshToken,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    // Only update device token if it's provided
    if (deviceToken) {
      updateData.deviceToken = deviceToken;
    }

    await user.update(updateData);

    // Return both tokens and user data
    const {
      password: _,
      refreshToken: __,
      refreshTokenExpiry: ___,
      ...userData
    } = user.toJSON();
    
    return successResponse(res, {
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

// Register controller
export async function register(req, res) {
  const { fullName, username, email, password, country, adminToken } = req.body;
  try {
    // Check if this is the first user (to be made admin)
    const userCount = await User.count();
    const isFirstUser = userCount === 0;

    // Validate country code
    const upperCode = country.toUpperCase();
    if (!Object.keys(UK_COUNTRIES).includes(upperCode)) {
      return badRequestResponse(res, 'Invalid country code. Must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR');
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });
    
    if (existingUser) {
      return badRequestResponse(res, "Email or username already registered");
    }

    // Determine if user should be admin
    let isAdmin = false;
    if (isFirstUser) {
      // First user is automatically made admin
      isAdmin = true;
    } else if (adminToken) {
      // Check if admin token is valid
      if (!config.admin.registrationToken || adminToken !== config.admin.registrationToken) {
        return unauthorizedResponse(res, "Invalid admin registration token");
      }
      isAdmin = true;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      country: upperCode,
      isAdmin
    });

    // Generate both tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Store refresh token in database
    await newUser.update({
      refreshToken,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Return both tokens and user data
    const {
      password: _,
      refreshToken: __,
      refreshTokenExpiry: ___,
      ...userData
    } = newUser.toJSON();

    return createdResponse(res, {
      user: userData,
      accessToken,
      refreshToken,
      message: isAdmin ? "Admin user created successfully" : "User registered successfully"
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

// Refresh token controller
export async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return unauthorizedResponse(res, "Refresh token is required");
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret);

    if (decoded.tokenType !== "refresh") {
      return unauthorizedResponse(res, "Invalid token type");
    }

    // Find user with this refresh token
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        refreshToken,
        refreshTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return unauthorizedResponse(res, "Invalid refresh token");
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Update refresh token in database
    await user.update({
      refreshToken: tokens.refreshToken,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return successResponse(res, {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return unauthorizedResponse(res, "Invalid refresh token");
    }
    return errorResponse(res, error.message);
  }
}

// Logout controller
export async function logout(req, res) {
  const { refreshToken } = req.body;

  try {
    // Find user with this refresh token and clear it
    await User.update(
      {
        refreshToken: null,
        refreshTokenExpiry: null,
      },
      {
        where: { refreshToken },
      }
    );

    return successResponse(res, null, "Logged out successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return successResponse(res, null, "If your email is registered, you will receive a password reset link");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // Update user with reset token
    await user.update({
      resetToken,
      resetTokenExpiry,
    });

    // TODO: Send email with reset link
    // You'll need to implement email sending functionality
    // Example: await sendResetEmail(user.email, resetToken);

    return successResponse(res, null, "If your email is registered, you will receive a password reset link");
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  try {
    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }, // Token not expired
      },
    });

    if (!user) {
      return badRequestResponse(res, "Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return successResponse(res, null, "Password has been reset successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
}

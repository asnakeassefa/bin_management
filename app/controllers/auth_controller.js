import { User } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/config.js";

// Token generation helper
const generateTokens = (userId) => {
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign({ userId }, config.development.jwt.secret, {
    expiresIn: "15m",
  });

  // Refresh token - long lived (7 days)
  const refreshToken = jwt.sign(
    { userId, tokenType: "refresh" },
    config.development.jwt.secret,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Login controller
export async function login(req, res) {
  const { email, password, deviceToken } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
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
    
    res.json({
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Register controller
export async function register(req, res) {
  const { fullName, username, email, password, country } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      country,
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
    res.status(201).json({
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Refresh token controller
export async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.development.jwt.secret);

    if (decoded.tokenType !== "refresh") {
      return res.status(401).json({ error: "Invalid token type" });
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
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Update refresh token in database
    await user.update({
      refreshToken: tokens.refreshToken,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    res.status(400).json({ error: error.message });
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

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return res.json({
        message:
          "If your email is registered, you will receive a password reset link",
      });
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

    res.json({
      message:
        "If your email is registered, you will receive a password reset link",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

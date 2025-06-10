import Joi from "joi";
import { UK_COUNTRIES } from './country_schemas.js';

// Common validation patterns
const patterns = {
  hexColor: /^#[0-9A-F]{6}$/i,
  username: /^[a-zA-Z0-9_]{3,30}$/,
  password: /^.{8,}$/,
};

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    fullName: Joi.string().min(2).max(50).required().messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters long",
      "string.max": "Full name cannot exceed 50 characters",
    }),
    username: Joi.string().pattern(patterns.username).required().messages({
      "string.pattern.base":
        "Username must be 3-30 characters and can only contain letters, numbers, and underscores",
      "string.empty": "Username is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string()
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must be at least 8 characters long and contain at least one letter and one number",
        "string.empty": "Password is required",
      }),
    country: Joi.string()
      .valid(...Object.keys(UK_COUNTRIES))
      .required()
      .messages({
        'any.only': 'Country code must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR',
        'string.empty': 'Country is required'
      }),
    adminToken: Joi.string().optional().messages({
      'string.empty': 'Admin token cannot be empty if provided'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
    deviceToken: Joi.string().optional(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  }),

  logout: Joi.object({
    refreshToken: Joi.string().required().messages({
      "string.empty": "Refresh token is required",
    }),
  }),

  sendVerification: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  }),

  verifyEmail: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    code: Joi.string().length(6).required().messages({
      "string.length": "Verification code must be 6 digits",
      "string.empty": "Verification code is required",
    }),
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  }),

  resendPasswordReset: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    code: Joi.string().length(6).required().messages({
      "string.length": "Reset code must be 6 digits",
      "string.empty": "Reset code is required",
    }),
    newPassword: Joi.string().pattern(patterns.password).required().messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and contain at least one letter and one number",
      "string.empty": "New password is required",
    }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      "string.empty": "Refresh token is required",
    }),
  }),
};

// Bin validation schemas
export const binSchemas = {
  addBin: Joi.object({
    binType: Joi.string()
      .valid("recycle", "garden", "general")
      .required()
      .messages({
        "any.only": "Bin type must be one of: recycle, garden, general",
        "string.empty": "Bin type is required",
      }),
    bodyColor: Joi.string().pattern(patterns.hexColor).required().messages({
      "string.pattern.base": "Body color must be a valid hex color code",
      "string.empty": "Body color is required",
    }),
    headColor: Joi.string().pattern(patterns.hexColor).required().messages({
      "string.pattern.base": "Head color must be a valid hex color code",
      "string.empty": "Head color is required",
    }),
    lastCollectionDate: Joi.date().max("now").required().messages({
      "date.base": "Last collection date must be a valid date",
      "date.max": "Last collection date cannot be in the future",
      "any.required": "Last collection date is required",
    }),
    collectionInterval: Joi.number().integer().min(1).required().messages({
      "number.base": "Collection interval must be a number",
      "number.min": "Collection interval must be at least 1 day",
      "any.required": "Collection interval is required",
    }),
    notifyDaysBefore: Joi.number().integer().min(0).default(1).messages({
      "number.base": "Notify days before must be a number",
      "number.min": "Notify days before cannot be negative",
    }),
  }),

  updateBinSchedule: Joi.object({
    lastCollectionDate: Joi.date().max("now").required().messages({
      "date.base": "Last collection date must be a valid date",
      "date.max": "Last collection date cannot be in the future",
      "any.required": "Last collection date is required",
    }),
    collectionInterval: Joi.number().integer().min(1).required().messages({
      "number.base": "Collection interval must be a number",
      "number.min": "Collection interval must be at least 1 day",
      "any.required": "Collection interval is required",
    }),
  }),

  updateBinAppearance: Joi.object({
    bodyColor: Joi.string().pattern(patterns.hexColor).required().messages({
      "string.pattern.base": "Body color must be a valid hex color code",
      "string.empty": "Body color is required",
    }),
    headColor: Joi.string().pattern(patterns.hexColor).required().messages({
      "string.pattern.base": "Head color must be a valid hex color code",
      "string.empty": "Head color is required",
    }),
  }),

  getUpcomingCollections: Joi.object({
    days: Joi.number().integer().min(1).max(30).default(7).messages({
      "number.base": "Days must be a number",
      "number.min": "Days must be at least 1",
      "number.max": "Days cannot exceed 30",
    }),
  }),
};

export const userSchemas = {
    createUser: Joi.object({
        fullName: Joi.string().min(2).max(50).required().messages({
            "string.empty": "Full name is required",
            "string.min": "Full name must be at least 2 characters long",
            "string.max": "Full name cannot exceed 50 characters",
        }),
        username: Joi.string().pattern(patterns.username).required().messages({
            "string.pattern.base": "Username must be 3-30 characters and can only contain letters, numbers, and underscores",
            "string.empty": "Username is required",
        }),
        email: Joi.string().email().required().messages({
            "string.email": "Please provide a valid email address",
            "string.empty": "Email is required",
        }),
        password: Joi.string().pattern(patterns.password).required().messages({
            "string.pattern.base": "Password must be at least 8 characters long and contain at least one letter and one number",
            "string.empty": "Password is required",
        }),
        country: Joi.string()
            .valid(...Object.keys(UK_COUNTRIES))
            .required()
            .messages({
                'any.only': 'Country code must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR',
                'string.empty': 'Country is required'
            }),
        isAdmin: Joi.boolean().default(false)
    }),

    updateUser: Joi.object({
        fullName: Joi.string().min(2).max(50).messages({
            "string.min": "Full name must be at least 2 characters long",
            "string.max": "Full name cannot exceed 50 characters",
        }),
        username: Joi.string().pattern(patterns.username).messages({
            "string.pattern.base": "Username must be 3-30 characters and can only contain letters, numbers, and underscores",
        }),
        email: Joi.string().email().messages({
            "string.email": "Please provide a valid email address",
        }),
        country: Joi.string()
            .valid(...Object.keys(UK_COUNTRIES))
            .messages({
                'any.only': 'Country code must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR'
            }),
        isAdmin: Joi.boolean()
    })
};

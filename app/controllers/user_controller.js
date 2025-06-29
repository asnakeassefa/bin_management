import { User } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { 
    successResponse, 
    errorResponse, 
    createdResponse, 
    badRequestResponse,
    notFoundResponse 
} from '../utils/responseHandler.js';
import { UK_COUNTRIES } from '../validations/country_schemas.js';

export const userController = {

    // create for a uset to get his profile
    


    // Create a new user (admin only)
    async createUser(req, res) {
        const { fullName, email, password, country, isAdmin } = req.body;
        try {
            // Validate country code
            const upperCode = country.toUpperCase();
            if (!Object.keys(UK_COUNTRIES).includes(upperCode)) {
                return badRequestResponse(res, 'Invalid country code. Must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR');
            }

            const existingUser = await User.findOne({ 
                where: { 
                    email
                } 
            });
            
            if (existingUser) {
                return badRequestResponse(res, "Email already registered");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                fullName,
                email,
                password: hashedPassword,
                country: upperCode,
                isAdmin: isAdmin || false
            });

            const {
                password: _,
                refreshToken: __,
                refreshTokenExpiry: ___,
                ...userData
            } = newUser.toJSON();

            return createdResponse(res, {
                message: 'User created successfully',
                user: userData
            });
        } catch (error) {
            return errorResponse(res, error.message);
        }
    },

    // Get all users (admin only)
    async getUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password', 'refreshToken', 'refreshTokenExpiry'] },
                order: [['createdAt', 'DESC']]
            });
            return successResponse(res, users);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    },

    // Update user (admin only)
    async updateUser(req, res) {
        const { userId } = req.params;
        const { fullName, email, country, isAdmin } = req.body;
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return notFoundResponse(res, 'User not found');
            }

            // Validate country if provided
            if (country) {
                const upperCode = country.toUpperCase();
                if (!Object.keys(UK_COUNTRIES).includes(upperCode)) {
                    return badRequestResponse(res, 'Invalid country code. Must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR');
                }
            }

            // Check for duplicate email/username if updating
            if (email) {
                const existingUser = await User.findOne({
                    where: {
                        email,
                        id: { [Op.ne]: userId }
                    }
                });
                if (existingUser) {
                    return badRequestResponse(res, 'Email already in use');
                }
            }

            await user.update({
                fullName: fullName || user.fullName,
                email: email || user.email,
                country: country ? country.toUpperCase() : user.country,
                isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin
            });

            const {
                password: _,
                refreshToken: __,
                refreshTokenExpiry: ___,
                ...userData
            } = user.toJSON();

            return successResponse(res, {
                message: 'User updated successfully',
                user: userData
            });
        } catch (error) {
            return errorResponse(res, error.message);
        }
    },

    // Delete user (admin only)
    async deleteUser(req, res) {
        const { userId } = req.params;
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return notFoundResponse(res, 'User not found');
            }

            await user.destroy();
            return successResponse(res, null, 'User deleted successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    },

    // Get the authenticated user's profile
    async getProfile(req, res) {
        try {
            // Assuming req.user is set by authentication middleware
            const userId = req.user.id;
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'refreshToken', 'refreshTokenExpiry'] }
            });
            if (!user) {
                return notFoundResponse(res, 'User not found');
            }
            return successResponse(res, user);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    },

    // Update the authenticated user's profile (name and country only)
    async editProfile(req, res) {
        try {
            const userId = req.user.id;
            const { fullName, country } = req.body;

            // Validate input
            if (!fullName && !country) {
                return badRequestResponse(res, 'At least one of fullName or country must be provided');
            }

            // Validate country if provided
            let upperCode;
            if (country) {
                upperCode = country.toUpperCase();
                if (!Object.keys(UK_COUNTRIES).includes(upperCode)) {
                    return badRequestResponse(res, 'Invalid country code. Must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR');
                }
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return notFoundResponse(res, 'User not found');
            }

            if (fullName) user.fullName = fullName;
            if (country) user.country = upperCode;

            await user.save();

            const {
                password: _,
                refreshToken: __,
                refreshTokenExpiry: ___,
                ...userData
            } = user.toJSON();

            return successResponse(res, {
                message: 'Profile updated successfully',
                user: userData
            });
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

};

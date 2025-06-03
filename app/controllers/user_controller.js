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
    // Create a new user (admin only)
    async createUser(req, res) {
        const { fullName, username, email, password, country, isAdmin } = req.body;
        try {
            // Validate country code
            const upperCode = country.toUpperCase();
            if (!Object.keys(UK_COUNTRIES).includes(upperCode)) {
                return badRequestResponse(res, 'Invalid country code. Must be one of: GB-ENG, GB-WLS, GB-SCT, GB-NIR');
            }

            const existingUser = await User.findOne({ 
                where: { 
                    [Op.or]: [{ email }, { username }] 
                } 
            });
            
            if (existingUser) {
                return badRequestResponse(res, "Email or username already registered");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                fullName,
                username,
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
        const { fullName, username, email, country, isAdmin } = req.body;
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
            if (email || username) {
                const existingUser = await User.findOne({
                    where: {
                        [Op.or]: [
                            email ? { email } : {},
                            username ? { username } : {}
                        ],
                        id: { [Op.ne]: userId }
                    }
                });
                if (existingUser) {
                    return badRequestResponse(res, 'Email or username already in use');
                }
            }

            await user.update({
                fullName: fullName || user.fullName,
                username: username || user.username,
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
    }
};

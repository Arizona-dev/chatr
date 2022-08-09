import bcryptjs from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import { User } from '../model/postgres/index';
import { ApiError } from '../utils/ApiError';

export const createUser = async (userBody) => {
    const {
        email, username, password,
    } = userBody;

    const newUser = await User.create({
        email,
        username,
        password,
    });

    return User.findByPk(newUser.id, {
        include: [],
    });
};

export const loginUserWithEmailAndPassword = async (email, password) => {
    const user = await User.findOne({ where: { email }, include: [] });
    if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect credentials');
    }
    if (!user.active) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is not active');
    }
    if (user?.googleId) {
        return false;
    }
    const isPasswordMatch = await bcryptjs.compare(password, user?.password);
    if (!isPasswordMatch) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect credentials');
    }

    return user;
};

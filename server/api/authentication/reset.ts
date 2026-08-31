import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectDB } from "../../../lib/database/mongodb";

import { Model } from 'mongoose';
import UserModel from '../../../lib/database/models/User';
import { User } from '~/types/user';
const User = UserModel as Model<User>;

const bodySchema = z.object({
    password: z.string(),
    confirm_password: z.string(),
    token: z.string()
})

export default defineEventHandler(async (event) => {
    const { password, confirm_password, token } = await readValidatedBody(event, bodySchema.parse);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await connectDB();

        if (password !== confirm_password) throw createError({ statusCode: 401, statusMessage: 'Try again' });

        await User.findOneAndUpdate({ resetPasswordToken: token }, {
            password: hashedPassword
        });

    } catch (error) {
        console.log(error);
        throw createError({
            statusCode: 401,
            message: 'Please try again'
        });
    };
});

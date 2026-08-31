import { z } from 'zod';
import { connectDB } from "../../../lib/database/mongodb";

import { Model } from 'mongoose';
import UserModel from '../../../lib/database/models/User';
import { User } from '~/types/user';
const User = UserModel as Model<User>;

import { nanoid } from "nanoid";
import { Resend } from 'resend';

// Notes on how to set this up
// https://www.youtube.com/watch?v=vAfUyKpWj_M

const bodySchema = z.object({
    email: z.email(),
    question: z.string(),
})

export default defineEventHandler(async (event) => {
    const { email, question } = await readValidatedBody(event, bodySchema.parse);

    // Nanoid creates a unique string
    const token = nanoid(32);

    const htmlBody = `
    <div>
        <h1>Welcome to GhostForm</h1>
        <a href="${process.env.PROJECT_DOMAIN}/${token}/resetpassword">Click here to reset password</a>
    </div>
    `;

    try {
        await connectDB();

        if (question !== '7') throw createError({ statusCode: 401, statusMessage: 'Try again' });

        else {
            const userFound = await User.findOne({ email });

            if (!userFound) throw createError({ statusCode: 401, statusMessage: 'Wrong credentials' });

            const resend = new Resend(`${process.env.RESEND_KEY}`);

            await resend.emails.send({
                from: 'NoReply@ascendpod.com',
                to: [email],
                subject: "Reset your password", // Subject line
                html: htmlBody
            });

            await User.findOneAndUpdate({ email: email.toLowerCase().trim() }, { resetPasswordToken: token })
        }

    } catch (error) {
        console.log(error);
        throw createError({
            statusCode: 401,
            message: 'Please try again'
        });
    };
});

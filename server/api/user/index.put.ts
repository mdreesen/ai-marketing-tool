import { z } from 'zod';
import loggedInUser from "~/utils/loggedInUser";

import { Model } from 'mongoose';
import UserModel from '../../../lib/database/models/User';
import { User } from '~/types/user';
const User = UserModel as Model<User>;

const bodySchema = z.object({
    name: z.string().nullable(),
    company: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    region: z.string().nullable(),
    calendar_link: z.string().nullable(),
    cold_lead_after_days: z.string().nullable()
})

export default defineEventHandler(async (event) => {
    const { name, company, phone, email, region, calendar_link, cold_lead_after_days } = await readValidatedBody(event, bodySchema.parse);
console.log(typeof cold_lead_after_days)
    const obj = {
        name: name,
        company: company,
        phone: phone,
        email: email,
        region: region,
        calendar_link: calendar_link,
        cold_lead_after_days: Number(cold_lead_after_days)
    };

    try {
        const user = await loggedInUser(event);

        await User.findOneAndUpdate(
            { _id: user?._id },
            { ...obj },
            { new: true });

    } catch (error) {
        console.log(error);
        throw createError({
            statusCode: 401,
            message: 'Please try again'
        });
    };
});

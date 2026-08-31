import { connectDB } from "../../lib/database/mongodb";
import { Model } from 'mongoose';
import UserModel from '../../lib/database/models/User';
import type { User } from '~/types/user';

const User = UserModel as Model<User>;

export default defineEventHandler(async (event) => {
    await connectDB();

    // requireUserSession throws its own 401 "Unauthorized" H3Error when there's
    // no valid session. We deliberately do NOT catch it here - letting it
    // propagate means callers (and the client) see a real 401, not a masked
    // 500. Masking it as 500 is what caused the confusing
    // "{ statusCode: 500, statusMessage: 'Something went wrong.' } Unauthorized"
    // error: a legitimate "you're not logged in" was being rewritten into a
    // generic server-fault message.
    const { user } = await requireUserSession(event);
    const userEmail = (user as User)?.email;

    try {
        const findUser = await User.findOne({ email: userEmail });

        if (!findUser) {
            // Session is valid but the user record is gone (e.g. deleted
            // account with a stale cookie still floating around). Treat this
            // as unauthorized too, not a server error.
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        return findUser;
    } catch (error: any) {
        // Re-throw auth errors as-is; anything else really is a server fault.
        if (error?.statusCode) throw error;

        console.error('loggedInUser lookup failed:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Something went wrong.'
        });
    }
});

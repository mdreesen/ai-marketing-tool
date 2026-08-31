import { z } from 'zod';
import bcrypt, { compareSync } from 'bcrypt';
import { connectDB } from "../../../lib/database/mongodb";

import { Model } from 'mongoose';
import UserModel from '../../../lib/database/models/User';
import { User } from '~/types/user';
const User = UserModel as Model<User>;

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  try {
    await connectDB();

    const user = await User.findOne({ email });
    const passwordMatches = bcrypt.compare(password, user?.password ?? '');

    if (await passwordMatches) {
      // set the user session in the cookie
      // this server util is auto-imported by the auth-utils module
      await setUserSession(event, {
        user: {
          _id: user?._id!,
          company: user?.company || '',
          company_hashed: user?.company_hashed || '',
          role: user?.role || '',
          category: user?.category || '',
          category_hashed: user?.category_hashed || '',
          qr_code_slug: user?.qr_code_slug || '',
          total_scans: user?.total_scans || '',
          leads_captured: user?.leads_captured || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          email: user?.email || '',
          email_hashed: user?.email_hashed || '',
          phone: user?.phone || '',
          password: user?.password || '',
          street_address: user?.street_address || '',
          city: user?.city || '',
          country: user?.country || '',
          postal_code: user?.postal_code || '',
          reset_password_token: user?.reset_password_token || '',
          privacy_policy: user?.privacy_policy || '',
          paid: user?.paid || '',
          paid_tier: user?.paid_tier || '',
          // leads: [lead] || '',
          createdAt: user?.createdAt || '',
          updatedAt: user?.updatedAt || ''
        }
      });
    }

    else {
      throw createError({ statusCode: 401, statusMessage: 'Wrong credentials' });
    }

  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 401,
      message: 'Please try again'
    });
  };
});

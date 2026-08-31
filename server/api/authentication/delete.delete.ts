import loggedInUser from '~/utils/loggedInUser';

import { Model } from 'mongoose';
import UserModel from '../../../lib/database/models/User';
import { User } from '~/types/user';

import Stripe from 'stripe';

const UserDoc = UserModel as Model<User>;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default defineEventHandler(async (event) => {
  try {
    const user = await loggedInUser(event);

    if (!user?._id) {
      throw createError({ statusCode: 401, statusMessage: 'Session expired.' });
    }

    // 1. Cancel the Stripe subscription IMMEDIATELY so billing stops now.
    //    Wrapped so a Stripe hiccup never blocks the user from deleting
    //    their account - we still tear down their data below.
    const stripeSubscriptionId = (user as any)?.stripeSubscriptionId as string | undefined;

    if (stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(stripeSubscriptionId);
      } catch (err: any) {
        // Already cancelled / not found is fine; log anything else.
        console.error('Stripe cancellation during account deletion failed:', err.message);
      }
    }

    await UserDoc.deleteOne({ _id: user._id });

  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 401,
      statusMessage: 'Please try again.'
    });
  };
});

import loggedInUser from '~/utils/loggedInUser';

export default defineEventHandler(async (event) => {
  try {
    const user = await loggedInUser(event);

    return user;

  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Something went wrong.'
    });
  }
});
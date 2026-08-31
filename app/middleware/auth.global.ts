export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();

  // Not authenticated at all and hitting the root -> login.
  if (!loggedIn.value && to.path === '/') {
    return navigateTo('/login');
  }

  // Everything below only guards the dashboard.
  if (!to.path.startsWith('/dashboard')) return;

  if (!loggedIn.value) {
    return navigateTo('/login');
  }

  // IMPORTANT: use useRequestFetch(), not $fetch.
  // During SSR (i.e. a page refresh) a plain $fetch to an internal API sends
  // NO cookies, so /api/user 401s even for a perfectly valid session and the
  // user gets bounced. useRequestFetch forwards the incoming request's
  // headers/cookies, so the session resolves correctly on both server and
  // client.
  const requestFetch = useRequestFetch();

  try {
    const me = await requestFetch<any>('/api/user');
    const status = me?.subscriptionStatus;
    const isActive =
      status === 'active' || status === 'trialing' || me?.paid === true;

    if (!isActive) {
      return navigateTo('/subscribe');
    }
  } catch (error: any) {
    const code = error?.statusCode ?? error?.response?.status;

    // Session genuinely missing/invalid -> log in again.
    if (code === 401) {
      return navigateTo('/login');
    }

    // Anything else (network blip, 500, timeout) is OUR problem, not the
    // user's. Fail OPEN and let them through: the server still enforces
    // access on every data endpoint via requirePaidUser, so an unsubscribed
    // user can't actually read anything. Previously this redirected to
    // /subscribe, which kicked paying customers to the pricing page on any
    // transient error.
    console.error('[auth] subscription check failed:', code ?? error);
    return;
  }
});

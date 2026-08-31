/**
 * Global 401 handler.
 *
 * Any API call anywhere in the app that comes back Unauthorized means the
 * session is missing or invalid - the correct response is always the same:
 * send the person to log in (or sign up if they've never had an account).
 * Centralizing this means individual pages/components don't need their own
 * 401 handling, and a masked/mishandled auth error can't silently show a
 * broken screen instead of redirecting.
 *
 * We patch the global $fetch instance via ofetch's onResponseError hook so
 * this applies to every $fetch / useFetch call app-wide.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()

  const authFetch = $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        // Avoid redirect loops if we're already on an auth page.
        const authPaths = ['/login', '/signup', '/forgotpassword']
        const onAuthPage = authPaths.some((p) => router.currentRoute.value.path.startsWith(p))

        if (!onAuthPage) {
          navigateTo('/login')
        }
      }
    }
  })

  // Replace the global $fetch so existing `$fetch(...)` calls throughout the
  // app automatically get this behavior without changing every call site.
  globalThis.$fetch = authFetch as typeof $fetch
})

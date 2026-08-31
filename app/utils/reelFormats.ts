/**
 * Re-export so Nuxt auto-imports work in components, while the server imports
 * the same file directly from /shared. One definition, two consumers — the
 * pattern that stopped the end card diverging.
 */
export * from '../../shared/reelFormats'

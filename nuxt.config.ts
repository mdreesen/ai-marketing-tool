// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: [
    '@nuxt/eslint',
    'nuxt-auth-utils',
    '@vueuse/motion/nuxt',
    '@nuxt/image',
    '@nuxtjs/color-mode',
    '@nuxt/ui',
    'nuxt-vitalizer',
    'nuxt-google-auth',
    'nuxt-notify',
    'nuxt-qrcode',
    '@vite-pwa/nuxt',
    'nuxt-charts',
  ],

  // Nitro wakes up and fires off task reminders
  nitro: {
    experimental: { tasks: true },
    tasks: {
      'lead:reminders': {
        handler: './server/tasks/lead/reminders', 
        description: 'Processes custom individual queues and recurring marketing blasts'
      }
    },
    scheduledTasks: {
      // Local-dev only (Vercel uses vercel.json). Once per day to mirror
      // the Hobby-plan cron: '0 15 * * *' = 15:00 UTC (US morning).
      '0 15 * * *': ['lead:reminders']
    },
  },
  routeRules: {
    // Disable caching so Vercel executes the function fresh
    '/api/cron': { swr: false, cache: false },
    // Stripe webhook must run fresh and read the raw body for signature checks.
    '/api/stripe/webhook': { swr: false, cache: false }
  },

  app: {
    head: {
      title: 'GhostForm Dashboard', // default fallback title
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap'
        },
      ],
    }
  },
  notify: {
    position: "top-right",
    duration: 5000,
    maxToasts: 5,
    theme: "light",
    showIcon: true,
  },
  qrcode: {
    options: {
      variant: 'circle', // rounded, circle
      radius: 1,
      blackColor: 'currentColor',
      whiteColor: 'transparent',
    },
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'date-fns',
        'lucide-vue-next',
        'vue-qrcode-reader',
        '@tanstack/vue-table',
        'nuxt-notify',
        'zod',
        'workbox-window',
        'exceljs', // CJS
      ]
    },
  },

  typescript: {
    strict: false
  },
  colorMode: {
    dataValue: 'theme',
    classSuffix: '',
  },

  pwa: {
    /* PWA options */
    manifest: {
      name: 'GhostForm Dashboard',
      short_name: 'GhostForm Dashboard',
      description: 'Manifest your leads instantly.',
      orientation: 'natural',
      lang: 'en',
      display: 'standalone',
      background_color: '#020203',
      theme_color: '#020203',
      icons: [
        {
          src: '/images/maskable-icon.png',
          sizes: '445x445',
          type: 'image/png',
          purpose: "any"
        },
        {
          src: '/images/maskable-icon.png',
          sizes: '445x445',
          type: 'image/webp',
          purpose: "png"
        },
        {
          src: '/images/maskable-icon.png',
          sizes: '445x445',
          type: 'image/png',
          purpose: "maskable"
        },
        {
          src: '/images/maskable-icon.png',
          sizes: '445x445',
          type: 'image/png',
        }
      ],
      categories: [
        "realtor",
        "housing",
        "leads",
        "lead generation",
        "scheduling",
        "personalization"
      ],
      display_override: [
        "standalone",
        "window-controls-overlay"
      ],
      prefer_related_applications: true,
    },
    registerType: 'autoUpdate',
    workbox: {
      'navigateFallback': '/login',
      // Cache static routes and core UI structures
      globPatterns: ['**/*.{js,css,html,png,svg}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      // Enable Background Sync API for deferred network payloads
      runtimeCaching: [
        {
          // Intercepts your background synchronization endpoint
          urlPattern: /\/api\/leads\/sync/,
          handler: 'NetworkOnly',
          method: 'POST',
          options: {
            backgroundSync: {
              name: 'mongodb-sync-queue',
              options: {
                maxRetentionTime: 24 * 60 // Max retry duration in minutes (24 Hours)
              }
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: true,
      type: 'module'
    },
  },

  // @vueuse/motion/nuxt
  runtimeConfig: {
    // Cloudflare R2 — egress is free, which matters because previews and
    // re-downloads are the dominant traffic in this product.
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET
    },
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',

    public: {
      // Public bucket domain. MUST be same-origin-able or canvas export throws
      // on a tainted image — the exact bug hit in GhostForm's card generator.
      assetBase: process.env.NUXT_PUBLIC_ASSET_BASE || '',
      motion: {
        directives: {
          'pop-bottom': {
            initial: {
              scale: 0,
              opacity: 0,
              y: 100,
            },
            visible: {
              scale: 1,
              opacity: 1,
              y: 0,
            }
          }
        }
      }
    }
  }
})
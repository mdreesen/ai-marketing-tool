import { z } from 'zod';

const EnvSchema = z.object({
    MONGO_URI: z.string(),
    RESEND_KEY: z.string(),
    PROJECT_DOMAIN: z.string(),
    NUXT_SESSION_PASSWORD: z.string(),
    // Stripe
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    // Price IDs used to map a purchase back to a plan name (optional but
    // recommended; without them the webhook defaults everyone to 'phantom').
    STRIPE_PRICE_SHADOW: z.string().optional(),
    STRIPE_PRICE_PHANTOM: z.string().optional()
});

export type EnvSchema = z.infer<typeof EnvSchema>;

export default EnvSchema.parse(process.env);

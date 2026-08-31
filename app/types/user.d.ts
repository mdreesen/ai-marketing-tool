export interface User {
    _id: object;
    company: string;
    company_hashed: string;
    role: string;
    category: string;
    category_hashed: string;
    qr_code_slug: string;
    total_scans: number;
    leads_captured: number;
    first_name: string;
    last_name: string;
    email: string;
    email_hashed: string;
    phone: string;
    password: string;
    street_address: string;
    city: string;
    country: string;
    postal_code: string;
    reset_password_token: string;
    privacy_policy: boolean;
    paid: boolean;
    paid_tier: string;
    leads: [];
    createdAt: string;
    updatedAt: string;
}
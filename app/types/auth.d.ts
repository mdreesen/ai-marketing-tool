// types/user.ts
export interface User {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    password?: string | undefined;
    country?: string;
    street_address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    time_zone?: string;
    fasting_time?: Number,
    tutorial_read?: Boolean,
    goal_weight?: string;
    affirmations?: [],
    bibles?: [],
    books?: [],
    cold_soaks?: [],
    gratitudes?: [],
    fasting?: [],
    habits?: [],
    journal?: [],
    settings?: [],
    water?: [],
    weight?: [],
    workout?: [],
    resetPasswordToken?: string;
    privacy_policy?: boolean;
    createdAt?: string;
    updatedAt?: string
  }
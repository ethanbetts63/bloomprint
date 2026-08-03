// bloomprint/frontend/src/types/users.ts

/**
 * The dashboard a user belongs to. Computed on the backend (see
 * UserProfileSerializer.get_role) so routing has a single source of truth.
 */
export type UserRole = 'admin' | 'florist' | 'affiliate' | 'customer';

/**
 * Defines the structure for a user's profile.
 */
export interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff?: boolean;
    is_superuser?: boolean;
    role: UserRole;
}

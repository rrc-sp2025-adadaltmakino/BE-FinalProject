export interface AuthorizationOptions {
    hasRole: Array<"admin" | "doctor" | "patient">;
    allowSameUser?: boolean;
}


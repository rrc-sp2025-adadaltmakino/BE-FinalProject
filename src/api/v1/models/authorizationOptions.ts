export interface AuthorizationOptions {
    hasRole: Array<"admin" | "manager" | "officer">;
    allowSameUser?: boolean;
}


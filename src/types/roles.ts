export const ROLES = ["ADMIN", "STUDENT", "WARDEN", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

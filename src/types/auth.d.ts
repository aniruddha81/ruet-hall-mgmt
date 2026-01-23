import type { Role } from "./roles";

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export { TokenPayload };

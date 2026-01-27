import type { Role } from "./roles";

interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

interface RefreshTokenPayload extends AccessTokenPayload {
  jti: string;
}

export { AccessTokenPayload, RefreshTokenPayload };
import type { Role } from "../../types/enums";

type AccessTokenPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  rollNumber?: string;
};

type RefreshTokenPayload = AccessTokenPayload & {
  jti: string;
};

import type { Session } from "@supabase/supabase-js";
import { UserStore } from "@stores/user.store";
import type { User } from "../../types/database.types";

export interface AuthUserResponse {
  id: string;
  email: string;
  role: User["role"];
  status: User["status"];
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  emailVerified?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUserResponse;
  token: string;
  refreshToken?: string;
}

export const mapUserToAuthUser = (user: User): AuthUserResponse => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  firstName: user.first_name,
  lastName: user.last_name,
  avatarUrl: user.avatar_url ?? undefined,
  emailVerified: user.email_verified ?? undefined,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const buildAuthResponse = async (
  userId: string,
  session: Session,
  refreshTokenOverride?: string,
): Promise<AuthResponse> => {
  if (!session?.access_token) {
    throw new Error("Session is invalid – missing access token");
  }

  const user = await UserStore.getUserById(userId);

  if (!user) {
    throw new Error("User not found in database");
  }

  return {
    user: mapUserToAuthUser(user),
    token: session.access_token,
    refreshToken: refreshTokenOverride ?? session.refresh_token ?? undefined,
  };
};

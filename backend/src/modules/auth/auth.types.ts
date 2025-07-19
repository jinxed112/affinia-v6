export interface AuthTokenPayload {
  userId: string;
  email: string;
  sessionId?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface AuthError {
  error: string;
  code: string;
  statusCode: number;
}
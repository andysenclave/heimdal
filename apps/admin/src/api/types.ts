export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Shape returned by GET /api/v1/auth/session
export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
  session: {
    id: string;
    orgId: string;
    aud: string;
    roles: string[];
    expiresAt: string;
  };
}

// Flat user shape used throughout the admin UI
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  orgId: string;
  roles: string[];
}

// Shape returned by POST /api/v1/auth/login and /auth/signup
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    orgId: string;
  };
  sessionId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

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

export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    orgId: string;
    roles: string[];
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

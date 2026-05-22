export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

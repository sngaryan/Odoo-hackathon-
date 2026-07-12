export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: any;
  };
}

export function sendResponse<T>(data: T, meta?: ApiResponse<T>["meta"]) {
  return {
    data,
    ...(meta ? { meta } : {}),
  };
}

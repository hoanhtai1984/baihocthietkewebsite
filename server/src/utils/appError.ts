export interface ErrorDetail {
  field: string;
  message: string;
}

// Lỗi nghiệp vụ có mã HTTP rõ ràng - ném từ service/middleware, errorHandler
// (middleware/errorHandler.ts) sẽ trả đúng statusCode + message cho client.
// `details` dùng cho lỗi validate: danh sách lỗi theo từng field.
export class AppError extends Error {
  statusCode: number;
  details?: ErrorDetail[];

  constructor(statusCode: number, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

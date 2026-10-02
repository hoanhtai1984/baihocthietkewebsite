// Lỗi nghiệp vụ có mã HTTP rõ ràng - ném từ route/transaction, middleware xử
// lỗi ở app.ts sẽ trả đúng status + message cho client.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

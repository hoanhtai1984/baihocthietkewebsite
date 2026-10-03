export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 50;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// Chuẩn hoá ?page=&limit= : page tối thiểu 1, limit trong [1, maxLimit].
export function parsePagination(
  query: { page?: unknown; limit?: unknown },
  { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {},
): PaginationParams {
  const rawPage = Math.floor(Number(query.page));
  const rawLimit = Math.floor(Number(query.limit));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, maxLimit) : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

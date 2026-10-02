// Bỏ dấu tiếng Việt + về chữ thường - dùng cho tìm kiếm không phân biệt dấu
// ("dieu hoa" tìm ra "Điều Hòa"). Postgres mặc định không có unaccent nên làm
// ở tầng ứng dụng (catalog nhỏ nên lọc trong bộ nhớ vẫn nhanh).
export function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

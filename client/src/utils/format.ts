export function formatMoney(value?: number | null) {
  if (value == null) return '';
  return value.toLocaleString('vi-VN') + 'đ';
}

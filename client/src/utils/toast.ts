export function showToast(message: string, type: 'success' | 'error' = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `app-toast ${type}`;
  const icon = document.createElement('i');
  icon.className = type === 'error' ? 'bi bi-x-circle-fill' : 'bi bi-check-circle-fill';
  const text = document.createElement('span');
  // textContent, không phải innerHTML - message thường chèn tên sản phẩm
  // (dữ liệu do admin nhập/import Excel), nếu chứa thẻ HTML thì innerHTML sẽ
  // thực thi nó (XSS), textContent luôn hiển thị dạng chữ thô an toàn.
  text.textContent = message;
  toast.append(icon, text);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, type === 'error' ? 4000 : 2500);
}

// Lấy thông báo lỗi tiếng Việt từ phản hồi API (axios), rơi về câu mặc định.
export function apiErrorMessage(err: any, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  return err?.response?.data?.message || fallback;
}

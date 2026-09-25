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
  icon.className = 'bi bi-check-circle-fill';
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
  }, 2500);
}

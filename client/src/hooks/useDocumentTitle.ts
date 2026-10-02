import { useEffect } from 'react';

const SITE_NAME = 'ĐiệnMáyMini';

// Đặt tiêu đề tab trình duyệt theo từng trang (SPA không tự đổi title).
export default function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Điện máy chính hãng`;
  }, [title]);
}

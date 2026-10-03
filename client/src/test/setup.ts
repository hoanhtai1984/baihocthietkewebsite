import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Dọn DOM + localStorage sau mỗi test để các test không ảnh hưởng nhau.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock window.scrollTo for jsdom environment
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

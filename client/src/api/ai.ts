import http, { unwrap } from './http';
import type { SuggestResult } from '../types';

export function suggestProducts(query: string) {
  return unwrap<SuggestResult>(http.post('/ai/suggest', { query }));
}

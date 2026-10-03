import http, { unwrap } from './http';
import type { Category } from '../types';

export function getCategories() {
  return unwrap<Category[]>(http.get('/categories'));
}

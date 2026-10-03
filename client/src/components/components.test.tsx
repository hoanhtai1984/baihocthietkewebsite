import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Pagination from './Pagination';
import ProductCard from './ProductCard';
import { getCart } from '../utils/cart';
import type { PaginationMeta } from '../types';

const meta = (page: number, totalPages: number): PaginationMeta => ({
  total: totalPages * 10,
  page,
  limit: 10,
  totalPages,
  hasNext: page < totalPages,
  hasPrev: page > 1,
});

describe('Pagination', () => {
  it('không hiện khi chỉ có 1 trang', () => {
    const { container } = render(<Pagination meta={meta(1, 1)} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('bấm số trang và nút sau/trước gọi onPageChange đúng trang', async () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={meta(2, 5)} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await userEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
    expect(onPageChange.mock.calls.map((c) => c[0])).toEqual([3, 3, 1]);
  });

  it('trang đầu khoá nút "trước", trang cuối khoá nút "sau"', () => {
    const { rerender } = render(<Pagination meta={meta(1, 3)} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    rerender(<Pagination meta={meta(3, 3)} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });

  it('đánh dấu trang hiện tại và rút gọn danh sách dài bằng dấu …', () => {
    render(<Pagination meta={meta(5, 20)} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '10' })).not.toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });
});

describe('ProductCard', () => {
  const product = { id: 1, slug: 'tu-lanh', name: 'Tủ lạnh LG', brand: 'LG', price: 8000000, oldPrice: 10000000, image: 'x.png', stock: 5 };
  const renderCard = (p = product) =>
    render(
      <MemoryRouter>
        <ProductCard product={p} />
      </MemoryRouter>,
    );

  it('hiện tên, hãng, giá và % giảm', () => {
    renderCard();
    expect(screen.getByText('Tủ lạnh LG')).toBeInTheDocument();
    expect(screen.getByText('LG')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('"Thêm vào giỏ" cho sản phẩm vào giỏ hàng', async () => {
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ/ }));
    expect(getCart()).toHaveLength(1);
    expect(getCart()[0]).toMatchObject({ id: 1, qty: 1 });
  });

  it('hết hàng: khoá cả 2 nút mua', () => {
    renderCard({ ...product, stock: 0 });
    expect(screen.getAllByText('Hết hàng').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Thêm vào giỏ/ })).toBeDisabled();
  });
});

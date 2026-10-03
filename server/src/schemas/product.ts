import * as yup from 'yup';

export const SORT_VALUES = ['newest', 'price-asc', 'price-desc', 'name-asc'] as const;

export const productQuerySchema = yup.object({
  category: yup.string().trim(),
  search: yup.string().trim().max(100),
  brand: yup.string().trim(),
  minPrice: yup.number().min(0),
  maxPrice: yup.number().min(0),
  sort: yup.string().oneOf([...SORT_VALUES]).default('newest'),
  page: yup.number().integer().min(1),
  limit: yup.number().integer().min(1).max(50),
});

// specs: object { "Tên thông số": "giá trị" } - bỏ cặp rỗng/không phải chữ.
const specsField = () =>
  yup
    .mixed<Record<string, string>>()
    .transform((value: unknown) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const result: Record<string, string> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const k = String(key).trim();
        const v = String(val ?? '').trim();
        if (k && v) result[k] = v;
      }
      return Object.keys(result).length > 0 ? result : null;
    })
    .nullable();

const price = (label: string) =>
  yup
    .number()
    .typeError(`${label} phải là số`)
    .integer(`${label} phải là số nguyên`)
    .min(1, `${label} phải lớn hơn 0`)
    .max(2_000_000_000, `${label} quá lớn`);

// Giá gốc: để trống / null = không có giá gốc
const optionalPrice = (label: string) =>
  yup
    .number()
    .transform((value: number, original: unknown) => (original === '' || original === null ? null : value))
    .nullable()
    .typeError(`${label} phải là số`)
    .integer(`${label} phải là số nguyên`)
    .min(1, `${label} phải lớn hơn 0`)
    .max(2_000_000_000, `${label} quá lớn`);

const fields = {
  name: yup.string().trim().max(200, 'Tên sản phẩm tối đa 200 ký tự'),
  brand: yup.string().trim().max(100, 'Hãng tối đa 100 ký tự'),
  image: yup.string().trim().max(500, 'Link ảnh tối đa 500 ký tự'),
  description: yup.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự'),
  stock: yup
    .number()
    .typeError('Tồn kho phải là số')
    .integer('Tồn kho phải là số nguyên')
    .min(0, 'Tồn kho không được âm')
    .max(1_000_000, 'Tồn kho quá lớn'),
  categoryId: yup.number().typeError('Danh mục không hợp lệ').integer('Danh mục không hợp lệ').min(1, 'Danh mục không hợp lệ'),
};

export const createProductSchema = yup.object({
  name: fields.name.required('Thiếu tên sản phẩm'),
  brand: fields.brand.required('Thiếu hãng'),
  image: fields.image.required('Thiếu link ảnh'),
  description: fields.description.required('Thiếu mô tả'),
  price: price('Giá bán').required('Thiếu giá bán'),
  oldPrice: optionalPrice('Giá gốc'),
  stock: fields.stock.default(0),
  categoryId: fields.categoryId.required('Thiếu danh mục'),
  specs: specsField(),
});

export const updateProductSchema = yup.object({
  name: fields.name.min(1, 'Tên sản phẩm không được để trống'),
  brand: fields.brand.min(1, 'Hãng không được để trống'),
  image: fields.image.min(1, 'Link ảnh không được để trống'),
  description: fields.description.min(1, 'Mô tả không được để trống'),
  price: price('Giá bán'),
  oldPrice: optionalPrice('Giá gốc'),
  stock: fields.stock,
  categoryId: fields.categoryId,
  hidden: yup.boolean(),
  specs: specsField(),
});

export const adminProductQuerySchema = yup.object({
  search: yup.string().trim().max(100),
  categoryId: yup.number().integer().min(1),
  status: yup.string().oneOf(['active', 'hidden', 'low']),
  page: yup.number().integer().min(1),
  limit: yup.number().integer().min(1).max(100),
});

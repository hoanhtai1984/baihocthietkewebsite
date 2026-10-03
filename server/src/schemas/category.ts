import * as yup from 'yup';

export const createCategorySchema = yup.object({
  name: yup.string().trim().required('Thiếu tên danh mục').max(100, 'Tên danh mục tối đa 100 ký tự'),
  icon: yup.string().trim().max(50).nullable().default(null),
  position: yup.number().integer('Thứ tự phải là số nguyên').min(0).max(10_000).default(0),
});

export const updateCategorySchema = yup.object({
  name: yup.string().trim().min(1, 'Tên danh mục không được để trống').max(100, 'Tên danh mục tối đa 100 ký tự'),
  icon: yup.string().trim().max(50).nullable(),
  position: yup.number().integer('Thứ tự phải là số nguyên').min(0).max(10_000),
});

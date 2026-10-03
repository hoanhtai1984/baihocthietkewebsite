import * as yup from 'yup';

// SĐT Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx (9-10 số sau đầu số); cho phép
// khoảng trắng/dấu chấm/gạch ngang rồi chuẩn hoá bỏ đi.
export const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

export const stripPhoneSeparators = (value: unknown) =>
  typeof value === 'string' ? value.replace(/[\s.-]/g, '') : value;

export const phoneField = () =>
  yup.string().trim().transform(stripPhoneSeparators).matches(PHONE_REGEX, 'Số điện thoại không hợp lệ');

export const idParamSchema = yup.object({
  id: yup.number().integer('Mã không hợp lệ').min(1, 'Mã không hợp lệ').required('Thiếu mã'),
});

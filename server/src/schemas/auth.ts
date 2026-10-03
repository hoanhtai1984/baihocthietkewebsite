import * as yup from 'yup';
import { PHONE_REGEX, phoneField, stripPhoneSeparators } from './common';

const passwordField = () =>
  yup.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự').max(72, 'Mật khẩu tối đa 72 ký tự');

export const registerSchema = yup.object({
  name: yup.string().trim().required('Thiếu họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  email: yup.string().trim().lowercase().required('Thiếu email').email('Email không hợp lệ'),
  password: passwordField().required('Thiếu mật khẩu'),
  phone: phoneField().optional().default(undefined),
});

export const loginSchema = yup.object({
  email: yup.string().trim().lowercase().required('Thiếu email'),
  password: yup.string().required('Thiếu mật khẩu'),
});

export const refreshSchema = yup.object({
  refreshToken: yup.string().required('Thiếu refreshToken'),
});

export const updateProfileSchema = yup.object({
  name: yup.string().trim().min(1, 'Họ tên không được để trống').max(100, 'Họ tên tối đa 100 ký tự'),
  // Chuỗi rỗng = xoá SĐT
  phone: yup
    .string()
    .trim()
    .transform(stripPhoneSeparators)
    .test('phone', 'Số điện thoại không hợp lệ', (value) => !value || PHONE_REGEX.test(value)),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Thiếu mật khẩu hiện tại'),
  newPassword: passwordField().required('Thiếu mật khẩu mới'),
});

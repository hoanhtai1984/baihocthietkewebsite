import * as yup from 'yup';
import { phoneField } from './common';

export const createOrderSchema = yup.object({
  items: yup
    .array()
    .of(
      yup.object({
        productId: yup.number().integer().min(1, 'Mã sản phẩm không hợp lệ').required('Thiếu mã sản phẩm'),
        quantity: yup
          .number()
          .integer('Số lượng phải là số nguyên')
          .min(1, 'Số lượng tối thiểu là 1')
          .max(99, 'Mỗi sản phẩm tối đa 99')
          .required('Thiếu số lượng'),
      }),
    )
    .min(1, 'Giỏ hàng trống')
    .max(50, 'Giỏ hàng có quá nhiều sản phẩm')
    .required('Giỏ hàng trống'),
  // Thông tin người nhận BẮT BUỘC cho mọi đơn (cả khách đã đăng nhập)
  guestName: yup.string().trim().required('Thiếu họ tên người nhận').max(100, 'Họ tên tối đa 100 ký tự'),
  guestPhone: phoneField().required('Thiếu số điện thoại'),
  guestAddress: yup.string().trim().required('Thiếu địa chỉ giao hàng').max(255, 'Địa chỉ tối đa 255 ký tự'),
});

export const lookupOrderSchema = yup.object({
  code: yup.string().trim().uppercase().required('Vui lòng nhập mã đơn'),
  phone: yup.string().trim().required('Vui lòng nhập số điện thoại'),
});

export const updateOrderStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'], 'Trạng thái không hợp lệ')
    .required('Thiếu trạng thái'),
});

export const adminOrderQuerySchema = yup.object({
  status: yup.string().oneOf(['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
  page: yup.number().integer().min(1),
  limit: yup.number().integer().min(1).max(100),
});

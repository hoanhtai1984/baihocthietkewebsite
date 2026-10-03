import * as yup from 'yup';

export const suggestSchema = yup.object({
  query: yup.string().trim().required('Vui lòng nhập câu hỏi').max(300, 'Câu hỏi quá dài (tối đa 300 ký tự)'),
});

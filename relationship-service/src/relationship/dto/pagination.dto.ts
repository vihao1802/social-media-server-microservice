import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10)) // Chuyển đổi kiểu dữ liệu
    .refine((val) => val > 0, { message: 'Page must be a positive number' }), // Kiểm tra số dương

  pageSize: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: 'PageSize must be a positive number',
    }),
  orderBy: z.string().optional(),
  sort: z.string().optional(),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

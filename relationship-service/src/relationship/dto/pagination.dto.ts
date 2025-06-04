import { optional, z } from 'zod';

export const PaginationSchema = z.object({
  page: z
    .preprocess((val) => parseInt(val as string, 10), z.number())
    .default(1)
    .refine((val) => val > 0, { message: 'Page must be a positive number' }),
  pageSize: z
    .preprocess((val) => parseInt(val as string, 10), z.number())
    .default(5)
    .refine((val) => val > 0, {
      message: 'PageSize must be a positive number',
    }),

  orderBy: z.string().optional(),
  sort: z.string().optional(),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

import { z } from 'zod';

export const UpdateUserSchema = z.object({
  username: z.string().max(32).optional(),
  email: z.string().email().optional(),
  dob: z
    .string()
    .transform((str) => new Date(str)) // Convert string to Date
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .refine((date) => date < new Date(), {
      message: 'Date of birth cannot be in the future',
    })
    .optional(),
  gender: z.enum(['Male', 'Female']).optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

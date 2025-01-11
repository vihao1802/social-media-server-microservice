import { z } from 'zod';

export const CreateUserSchema = z
  .object({
    username: z.string().max(32),
    email: z.string().email(),
    dob: z
      .string()
      .transform((str) => new Date(str)) // Convert string to Date
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid date format',
      })
      .refine((date) => date < new Date(), {
        message: 'Date of birth cannot be in the future',
      }),

    password: z
      .string()
      .min(8)
      .max(4096)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/gm,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      ),
    gender: z.enum(['Male', 'Female']),
    profilePicture: z.string().url().optional(),
  })
  .strict();

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

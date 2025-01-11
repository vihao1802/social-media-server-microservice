import { z } from 'zod';

export const UpdatePasswordSchema = z
  .object({
    oldPassword: z.string().min(8).max(4096),
    newPassword: z
      .string()
      .min(8)
      .max(4096)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/gm,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      ),
  })
  .strict();

export type UpdatePasswordDto = z.infer<typeof UpdatePasswordSchema>;

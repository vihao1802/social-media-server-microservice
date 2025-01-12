import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    resetToken: z.string(),
    newPassword: z
      .string()
      .min(8)
      .max(4096)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/gm,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      ),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

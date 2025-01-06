import { emit } from "process";
import { z } from "zod";

export const SignInRequestSchema = z.object({
    email: z
        .string()
        .email(),
    password: z
        .string()
}).strict()

export type SignInRequest = z.infer<typeof SignInRequestSchema>
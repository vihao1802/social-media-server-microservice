import { Prisma } from '@prisma/client';

export type UserResponse = Omit<Prisma.UserGetPayload<{}>, 'hashedPassword'>;

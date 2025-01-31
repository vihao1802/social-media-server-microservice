export type User = {
  id: string;
  email: string;
  hashedPassword: string;
  bio: string | null;
  username: string;
  profileImg: string | null;
  gender: string;
  DateOfBirth: Date;
  isLocked: boolean;
  isEmailVerified: boolean;
  isDisabled: boolean;
  isOnline: boolean;
  isPrivateAccount: boolean;
  createdAt: DateTime;
  role: Role;
  Token?: string;
};

type Role = {
  roleName: string;
};

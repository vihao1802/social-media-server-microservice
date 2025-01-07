export type AuthJwtPayload = {
    sub: string;
    username: string;
    email: string;
    role: string;
    iat: number;
};
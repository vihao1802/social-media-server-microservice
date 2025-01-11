import { HttpStatus } from "@nestjs/common";

export interface IErrorCode {
    message: string;
    code: number;
    httpStatus: HttpStatus;
}
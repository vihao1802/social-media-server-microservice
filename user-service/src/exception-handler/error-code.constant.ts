import { HttpStatus } from '@nestjs/common';
import { IErrorCode } from './exception.interface';

const BadRequestCode: Record<string, IErrorCode> = {
  USER_ALREADY_EXISTS: {
    message: 'User already exist',
    code: 1001,
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  EMAIL_ALREADY_EXISTS: {
    message: 'Email already exists',
    code: 2004,
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_EMAIL_PASSWORD: {
    message: 'Invalid email or password',
    code: 1002,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  INVALID_PASSWORD: {
    message: 'Invalid password',
    code: 1002,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  INVALID_REQUEST: {
    message: 'Invalid request',
    code: 1003,
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INSUFFICIENT_PERMISSION: {
    message: 'Insufficient permission',
    code: 1004,
    httpStatus: HttpStatus.BAD_REQUEST,
  },
};
const UnauthorizedCode: Record<string, IErrorCode> = {
  UNEXPECTED_ERROR: {
    message: 'Unexpected error',
    code: 2001,
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  RESOURCE_NOT_FOUND: {
    message: 'Resource not found',
    code: 2002,
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  USER_NOT_FOUND: {
    message: 'User not found',
    code: 2003,
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  AUTHENTICATION_FAILED: {
    message: 'Authentication failed',
    code: 2003,
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
};
const InternalServerErrorCode: Record<string, IErrorCode> = {
  INTERNAL_SERVER_ERROR: {
    message: 'Server error',
    code: 3001,
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
export const ErrorCodes = {
  BadRequestCode,
  UnauthorizedCode,
  InternalServerErrorCode,
};

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(zodError: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const message = zodError.issues.map((error) => {
      return `${error.path}: ${error.message}`;
    });

    res.status(400).json({
      status: 400,
      message: message,
    });
  }
}

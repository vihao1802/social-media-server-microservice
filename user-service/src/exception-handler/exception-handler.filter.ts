import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BadRequestException } from './bad-request.exception';
import { HttpAdapterHost } from '@nestjs/core';
import { UnauthorizedException } from './unauthorized.exception';
import { InternalServerException } from './internal-server.exception';
import { ZodError } from 'zod';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }
  catch(exception: unknown, host: ArgumentsHost) {
    console.log(exception);

    const ctx = host.switchToHttp();

    const { httpAdapter } = this.httpAdapterHost;
    if (exception instanceof BadRequestException) {
      const httpStatus = exception.getStatus();

      const request = ctx.getRequest();
      exception.setTraceId(request.id);

      const responseBody = exception.generateHttpResponseBody();
      // Retrieves the HTTP status code from the `BadRequestException`.
      if (process.env.NODE_ENV === 'development')
        Logger.error(exception.message, exception.stack, 'GlobalExceptionFilter');
      else
        Logger.error(exception.message, 'GlobalExceptionFilter');
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }

    if (exception instanceof UnauthorizedException) {
      const httpStatus = exception.getStatus();

      const request = ctx.getRequest();
      exception.setTraceId(request.id);

      const responseBody = exception.generateHttpResponseBody();
      // Retrieves the HTTP status code from the `BadRequestException`.
      if (process.env.NODE_ENV === 'development')
        Logger.error(exception.message, exception.stack, 'GlobalExceptionFilter');
      else
        Logger.error(exception.message, 'GlobalExceptionFilter');
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
      return;
    }

    if (exception instanceof InternalServerException) {
      const httpStatus = exception.getStatus();

      const request = ctx.getRequest();
      exception.setTraceId(request.id);

      const responseBody = exception.generateHttpResponseBody();
      // Retrieves the HTTP status code from the `BadRequestException`.
      if (process.env.NODE_ENV === 'development')
        Logger.error(exception.message, exception.stack, 'GlobalExceptionFilter');
      else
        Logger.error(exception.message, 'GlobalExceptionFilter');
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
      return;
    }

    if (exception instanceof ZodError) {

      const ctx = host.switchToHttp();
      const response = ctx.getResponse();

      // Chuyển đổi lỗi Zod thành BadRequestException
      const errors = exception.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      response.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        errors,
      });
      return;
    }
    const response = ctx.getResponse();

    // Chuyển đổi lỗi Zod thành BadRequestException

    response.status(500).json({
      statusCode: 500,
      message: exception instanceof Error ? exception.message : 'Internal server error',
    });
  }

}

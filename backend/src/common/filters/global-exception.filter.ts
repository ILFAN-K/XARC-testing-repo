import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.warn(
        `HTTP ${status} ${request.method} ${request.url} - ${typeof exceptionResponse === 'string' ? exceptionResponse : JSON.stringify(exceptionResponse)}`,
      );

      response.status(status).json(exceptionResponse);
      return;
    }

    // Handle Prisma known request errors
    if (this.isPrismaError(exception)) {
      const prismaError = exception as any;

      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target;
        const message = `Unique constraint violation on: ${Array.isArray(target) ? target.join(', ') : target || 'unknown field'}`;
        this.logger.warn(`Prisma P2002 ${request.method} ${request.url} - ${message}`);

        response.status(HttpStatus.CONFLICT).json({
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message,
        });
        return;
      }

      if (prismaError.code === 'P2025') {
        const message = prismaError.meta?.cause || 'Record not found';
        this.logger.warn(`Prisma P2025 ${request.method} ${request.url} - ${message}`);

        response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message,
        });
        return;
      }
    }

    // Unknown / unhandled errors
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger.error(
      `Unhandled exception ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProduction
        ? 'Internal server error'
        : exception instanceof Error
          ? exception.message
          : 'Internal server error',
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    );
  }
}

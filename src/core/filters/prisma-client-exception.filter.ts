import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

function humanizeUniqueTarget(fields: string[]): string {
  if (fields.length === 0) {
    return 'identifiers';
  }
  const parts = fields.map((f) => {
    if (f === 'email') {
      return 'email';
    }
    if (f === 'userNumber' || f === 'user_number') {
      return 'user number';
    }
    return f;
  });
  if (parts.length === 1) {
    return parts[0];
  }
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

@Catch(PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(
    exception: PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const target = exception.meta?.target;
      const fields = !target
        ? []
        : Array.isArray(target)
          ? target.map(String)
          : [String(target)];
      const phrase = humanizeUniqueTarget(fields);
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: `A user with this ${phrase} already exists.`,
      });
      return;
    }

    throw exception;
  }
}

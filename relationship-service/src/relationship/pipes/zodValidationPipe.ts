import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

export class zodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(zodValidationPipe.name);

  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Chỉ validate nếu type là 'query'
    if (metadata.type !== 'query') {
      return value;
    }
    const parsedValue = this.schema.safeParse(value);
    if (parsedValue.success) return parsedValue.data;

    this.logger.error(parsedValue.error.errors);
    throw new ZodError(parsedValue.error.errors);
  }
}

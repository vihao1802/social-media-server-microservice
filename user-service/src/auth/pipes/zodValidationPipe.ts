import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { ZodError, ZodSchema } from "zod";

export class zodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: any, metadata: ArgumentMetadata) {
        const parsedValue = this.schema.safeParse(value);
        if (parsedValue.success)
            return parsedValue.data;

        throw new ZodError(parsedValue.error.errors);

    }

}
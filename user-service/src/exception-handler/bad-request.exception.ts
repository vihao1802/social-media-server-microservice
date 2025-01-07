import { HttpException, HttpStatus } from "@nestjs/common";
import { IErrorCode } from "./exception.interface";

export class BadRequestException extends HttpException {
    private code: number;
    private timestamp: string;
    private traceId: string;
    constructor(private errorCode: IErrorCode, private customMessage?: string) {

        super(customMessage ? customMessage : errorCode.message, errorCode.httpStatus);
        this.code = errorCode.code;
        this.timestamp = new Date().toISOString();
    }

    setTraceId(traceId: string) {
        this.traceId = traceId;
    }
    generateHttpResponseBody() {
        return {
            code: this.code,
            message: this.message || 'Bad request',
            timestamp: this.timestamp,
            traceId: this.traceId,
        };
    }
}
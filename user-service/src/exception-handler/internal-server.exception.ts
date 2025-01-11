import { HttpException } from "@nestjs/common";
import { IErrorCode } from "./exception.interface";

export class InternalServerException extends HttpException {
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
            message: this.message || 'Internal server error',
            timestamp: this.timestamp,
            traceId: this.traceId,
        };
    }
}
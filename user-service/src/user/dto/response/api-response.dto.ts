import { HttpStatus } from '@nestjs/common';

export class ApiResponse {
  private status: HttpStatus;
  private message: string;
  private data: any;

  constructor(status: HttpStatus, message: string, data: any) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

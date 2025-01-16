import { HttpStatus } from '@nestjs/common';

export class ApiResponse {
  private status: HttpStatus;
  private data: any;
  private message: string;
  constructor(
    status: HttpStatus,
    data: any,
    message: string = 'Fetch success !',
  ) {
    this.status = status;
    this.data = data;
    this.message = message;
  }
}

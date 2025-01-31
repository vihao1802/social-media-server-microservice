import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {

  private readonly ALLOW_MIME_TYPE = ['image/jpeg', 'image/png', 'image/gif'];
  
  transform(value: any, metadata: ArgumentMetadata) {
    if( value.size > process.env.MAX_FILE_SIZE ){
      throw new BadRequestException('File size too large');
    }

    if( !this.ALLOW_MIME_TYPE.includes(value.mimetype) ){
      throw new BadRequestException('Invalid file type');
    }
    return value;
  }
}

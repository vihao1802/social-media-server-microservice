import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, UpdateUserSchema } from './dto/update-user.dto';
import { zodValidationPipe } from 'src/auth/pipes/zodValidationPipe';
import {
  UpdatePasswordDto,
  UpdatePasswordSchema,
} from './dto/update-password-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { PaginationDto, paginationSchema } from './dto/pagination.dto';
import { Roles } from 'src/auth/decorator/role.decorator';
import { ROLE } from 'src/auth/enum/role.constant';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { AuthService } from 'src/auth/auth.service';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles([ROLE.USER])
  @UseGuards(RolesGuard)
  @UsePipes(new zodValidationPipe(paginationSchema))
  findMany(@Query() paginationDto: PaginationDto) {
    return this.userService.findMany(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('update')
  @UsePipes(new zodValidationPipe(UpdateUserSchema))
  update(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.userService.update(req.user.sub, updateUserDto);
  }

  @Patch('update/password')
  @UsePipes(new zodValidationPipe(UpdatePasswordSchema))
  updatePassword(@Body() updatePasswordDto: UpdatePasswordDto, @Request() req) {
    return this.userService.updatePassword(req.user.sub, updatePasswordDto);
  }
}

import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { AuthGuard } from './guards/auth/auth.guard';
import { ApiResponse } from './dto/api-response.dto';
import { RelationshipStatus } from './enum/relationship.enum';
import { PaginationDto, PaginationSchema } from './dto/pagination.dto';
import { zodValidationPipe } from './pipes/zodValidationPipe';

@UseGuards(AuthGuard)
@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Get('me/following')
  @UsePipes(new zodValidationPipe(PaginationSchema))
  async GetMyFollowing(@Request() req, @Query() paginationDto: PaginationDto) {
    const result = await this.relationshipService.GetUserFollowingList(
      req.user.id,
      paginationDto,
    );
    return new ApiResponse(HttpStatus.OK, result);
  }

  @Get(':userId/following')
  @UsePipes(new zodValidationPipe(PaginationSchema))
  async GetUserFollowing(
    @Query('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.relationshipService.GetUserFollowingList(
      userId,
      paginationDto,
    );
    return new ApiResponse(HttpStatus.OK, result);
  }
  @Get('me/follower')
  async GetMyFollower(@Request() req, @Query() paginationDto: PaginationDto) {
    const result = await this.relationshipService.GetUserFollowerList(
      req,
      paginationDto,
    );
    return new ApiResponse(HttpStatus.OK, result);
  }

  @Get(':userId/follower')
  async GetUserFollower(
    @Query('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.relationshipService.GetUserFollowerList(
      userId,
      paginationDto,
    );
    return new ApiResponse(HttpStatus.OK, result);
  }

  @Post('follow/:userId')
  async FollowUser(@Request() req, @Query('userId') userId: string) {
    await this.relationshipService.FollowUser(req.user.id, userId);
    return new ApiResponse(HttpStatus.OK, 'Followed successfully');
  }

  @Post('unfollow/:userId')
  async UnFollowUser(@Request() req, @Query('userId') userId: string) {
    await this.relationshipService.UnFollowUser(req.user.id, userId);
    return new ApiResponse(HttpStatus.OK, 'Unfollowed successfully');
  }

  @Post('accept/:userId')
  async AcceptUserFollowRequest(
    @Request() req,
    @Query('userId') userId: string,
  ) {
    await this.relationshipService.AcceptUserFollowRequest(userId, req.user.id);
    return new ApiResponse(HttpStatus.OK, 'Accepted successfully');
  }

  @Post('reject/:userId')
  async RejectUserFollowRequest(
    @Request() req,
    @Query('userId') userId: string,
  ) {
    await this.relationshipService.RejectUserFollowRequest(userId, req.user.id);
    return new ApiResponse(HttpStatus.OK, 'Rejected successfully');
  }

  @Get('me/block-list')
  async GetMyBlockList(@Request() req) {
    return await this.relationshipService.GetMyBlockList(req.user.id);
  }

  @Post(':userId/block')
  async BlockUser(@Request() req, @Query('userId') userId: string) {
    return await this.relationshipService.BlockUser(req.user.id, userId);
  }
  @Post(':userId/unblock')
  async UnBlockUser(@Query('userId') userId: string, @Request() req) {
    return await this.relationshipService.UnblockerUser(req.user.id, userId);
  }
  // @Get('me/recommendation')
  // async GetRecommendation(
  //   @Request() req,
  //   @Query() paginationDto: PaginationDto,
  // ) {
  //   return await this.relationshipService.GetRecommendation(
  //     req.user.id,
  //     paginationDto,
  //   );
  // }
}

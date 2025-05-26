import {
  Controller,
  Get,
  HttpStatus,
  Param,
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
      req.user,
      paginationDto,
    );
    return new ApiResponse(HttpStatus.OK, result);
  }

  @Get(':userId/following')
  @UsePipes(new zodValidationPipe(PaginationSchema))
  async GetUserFollowing(
    @Request() req,
    @Query() paginationDto: PaginationDto,
    @Param('userId') userId: string,
  ) {
    const result = await this.relationshipService.GetUserFollowingList(
      req.user,
      paginationDto,
      userId,
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
    @Request() req,
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.relationshipService.GetUserFollowerList(
      req.user,
      paginationDto,
      userId,
    );
    return new ApiResponse(HttpStatus.OK, result);
  }

  @Post('follow/:userId')
  async FollowUser(@Request() req, @Param('userId') userId: string) {

    await this.relationshipService.FollowUser(req.user, userId);
    return new ApiResponse(HttpStatus.OK, 'Followed successfully');
  }

  @Post('unfollow/:userId')
  async UnFollowUser(@Request() req, @Param('userId') userId: string) {
    await this.relationshipService.UnFollowUser(req.user, userId);
    return new ApiResponse(HttpStatus.OK, 'Unfollowed successfully');
  }

  @Post('accept/:userId')
  async AcceptUserFollowRequest(
    @Request() req,
    @Param('userId') userId: string,
  ) {
    await this.relationshipService.AcceptUserFollowRequest(userId, req.user);
    return new ApiResponse(HttpStatus.OK, 'Accepted successfully');
  }

  @Post('reject/:userId')
  async RejectUserFollowRequest(
    @Request() req,
    @Param('userId') userId: string,
  ) {
    await this.relationshipService.RejectUserFollowRequest(userId, req.user);
    return new ApiResponse(HttpStatus.OK, 'Rejected successfully');
  }

  @Get('me/block-list')
  @UsePipes(new zodValidationPipe(PaginationSchema))
  async GetMyBlockList(@Request() req, @Query() paginationDto: PaginationDto) {
    return await this.relationshipService.GetMyBlockList(
      req.user,
      paginationDto,
    );
  }

  @Post('block/:userId')
  async BlockUser(@Request() req, @Param('userId') userId: string) {
    return await this.relationshipService.BlockUser(req.user, userId);
  }
  @Post('unblock/:userId')
  async UnBlockUser(@Param('userId') userId: string, @Request() req) {
    return await this.relationshipService.UnblockerUser(req.user, userId);
  }
  @Get('me/recommendation')
  async GetRecommendation(
    @Request() req,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.relationshipService.GetRecommendation(
      req.user.id,
      paginationDto,
    );
  }
}

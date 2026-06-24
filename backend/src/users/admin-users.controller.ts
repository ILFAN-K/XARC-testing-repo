import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import {
  PaginatedUsersResponseDto,
  UserStatsResponseDto,
  RoleDto,
  UserProfileResponseDto,
  PaginatedActivityResponseDto,
  UserWorkspaceResponseDto,
} from './dto/user-response.dto';

/**
 * Admin controller for user management operations.
 *
 * All endpoints are protected by Firebase authentication and require
 * SUPERADMIN or ADMIN role.
 */
@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // ─── List Users (Paginated) ──────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List users with pagination, search, and filters' })
  @ApiResponse({ status: 200, description: 'Paginated user list', type: PaginatedUsersResponseDto })
  findAll(@Query() query: GetUsersQueryDto, @CurrentUser() user: any) {
    return this.adminUsersService.findAll(query, user.organizationId);
  }

  // ─── User Statistics ─────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics for dashboard cards' })
  @ApiResponse({ status: 200, description: 'User statistics', type: UserStatsResponseDto })
  getStats(@CurrentUser() user: any) {
    return this.adminUsersService.getStats(user.organizationId);
  }

  // ─── Available Roles ─────────────────────────────────────────────────

  @Get('roles')
  @ApiOperation({ summary: 'Get available roles for user creation and filtering' })
  @ApiResponse({ status: 200, description: 'List of available roles', type: [RoleDto] })
  getRoles() {
    return this.adminUsersService.getRoles();
  }

  // ─── Create User ─────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new user with invitation-based onboarding' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.adminUsersService.createUser(
      {
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        role: createUserDto.role,
        sendInvitation: createUserDto.sendInvitation,
      },
      user.sub,
      user.organizationId,
    );
  }

  // ─── User Profile ────────────────────────────────────────────────────

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile details' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserProfileResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminUsersService.getProfile(id, user.organizationId, user.sub);
  }

  // ─── User Activity ───────────────────────────────────────────────────

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get paginated user activity from audit logs' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Paginated activity log', type: PaginatedActivityResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  getActivity(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminUsersService.getActivity(id, user.organizationId, user.sub, Number(page) || 1, Number(limit) || 10);
  }

  // ─── User Workspace ──────────────────────────────────────────────────

  @Get(':id/workspace')
  @ApiOperation({ summary: 'Get aggregated user workspace (profile + activity summary)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User workspace data', type: UserWorkspaceResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  getWorkspace(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminUsersService.getWorkspace(id, user.organizationId, user.sub);
  }

  // ─── Resend Invitation ───────────────────────────────────────────────

  @Post(':id/resend-invitation')
  @ApiOperation({ summary: 'Resend invitation email to a pending user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Invitation resent successfully' })
  @ApiResponse({ status: 400, description: 'User is not in PENDING_INVITATION status' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resendInvitation(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.adminUsersService.resendInvitation(id, user.sub, user.organizationId);
  }

  // ─── Delete User (Soft) ──────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.adminUsersService.softDelete(id, user.sub, user.organizationId);
  }
}

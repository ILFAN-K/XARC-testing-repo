import { ApiProperty } from '@nestjs/swagger';

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

/**
 * Represents a single user's profile as returned by `GET /admin/users/:id/profile`.
 */
export class UserProfileResponseDto {
  @ApiProperty({ description: 'Unique user identifier', example: 'usr_abc123' })
  id!: string;

  @ApiProperty({ description: 'Full name of the user', example: 'Jane Doe' })
  fullName!: string;

  @ApiProperty({ description: 'Email address', example: 'jane.doe@example.com' })
  email!: string;

  @ApiProperty({
    description: 'Assigned role',
    example: 'STUDENT',
    enum: ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT'],
  })
  role!: string;

  @ApiProperty({
    description: 'Current account status',
    example: 'ACTIVE',
    enum: ['PENDING_INVITATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  status!: string;

  @ApiProperty({ description: 'Account creation timestamp', example: '2026-01-15T08:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last login timestamp (null if never logged in)',
    example: '2026-06-10T14:22:00.000Z',
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({
    description: 'Last recorded activity timestamp (null if no activity)',
    example: '2026-06-12T09:15:00.000Z',
    nullable: true,
  })
  lastActivityAt!: Date | null;
}

// ---------------------------------------------------------------------------
// User Stats
// ---------------------------------------------------------------------------

/**
 * Aggregate statistics for the admin dashboard, returned by `GET /admin/users/stats`.
 */
export class UserStatsResponseDto {
  @ApiProperty({ description: 'Total number of registered users', example: 150 })
  totalUsers!: number;

  @ApiProperty({ description: 'Number of currently active users', example: 120 })
  activeUsers!: number;

  @ApiProperty({ description: 'Number of users with an admin-level role', example: 5 })
  adminUsers!: number;

  @ApiProperty({ description: 'Number of pending invitation users', example: 12 })
  pendingInvitations!: number;
}

// ---------------------------------------------------------------------------
// Paginated Users
// ---------------------------------------------------------------------------

/**
 * Paginated list of users returned by `GET /admin/users`.
 *
 * The `items` array contains plain user objects (not full profile DTOs)
 * so the shape is intentionally kept flexible.
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({
    description: 'Array of user objects for the current page',
    type: 'array',
    items: { type: 'object' },
  })
  items!: Record<string, any>[];

  @ApiProperty({ description: 'Total number of users matching the query', example: 150 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit!: number;
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/**
 * Represents a single user-activity log entry.
 */
export class UserActivityItemDto {
  @ApiProperty({ description: 'Unique activity entry identifier', example: 'act_xyz789' })
  id!: string;

  @ApiProperty({ description: 'Machine-readable action key', example: 'LOGIN' })
  action!: string;

  @ApiProperty({ description: 'Human-readable description of the action', example: 'User logged in from 192.168.1.10' })
  description!: string;

  @ApiProperty({ description: 'Timestamp of the activity', example: '2026-06-12T09:15:00.000Z' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Optional metadata associated with the activity',
    example: { ip: '192.168.1.10', userAgent: 'Mozilla/5.0' },
    required: false,
    nullable: true,
  })
  metadata?: Record<string, any>;
}

/**
 * Paginated activity log returned by `GET /admin/users/:id/activity`.
 */
export class PaginatedActivityResponseDto {
  @ApiProperty({
    description: 'Array of activity entries for the current page',
    type: [UserActivityItemDto],
  })
  items!: UserActivityItemDto[];

  @ApiProperty({ description: 'Total number of activity entries', example: 42 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit!: number;
}

// ---------------------------------------------------------------------------
// User Workspace
// ---------------------------------------------------------------------------

/** Summary of a user's activity metrics. */
class ActivitySummaryDto {
  @ApiProperty({ description: 'Total number of recorded actions', example: 256 })
  totalActions!: number;

  @ApiProperty({
    description: 'Timestamp of the most recent activity (null if none)',
    example: '2026-06-12T09:15:00.000Z',
    nullable: true,
  })
  lastActivityAt!: Date | null;
}

/**
 * Composite workspace view for a single user, returned by `GET /admin/users/:id/workspace`.
 *
 * Combines the user's profile, an activity summary, and a list of recent activities.
 */
export class UserWorkspaceResponseDto {
  @ApiProperty({
    description: 'User profile information',
    type: UserProfileResponseDto,
  })
  profile!: UserProfileResponseDto;

  @ApiProperty({
    description: 'Aggregated activity summary',
    type: ActivitySummaryDto,
  })
  activitySummary!: ActivitySummaryDto;

  @ApiProperty({
    description: 'Most recent activity entries',
    type: [UserActivityItemDto],
  })
  recentActivities!: UserActivityItemDto[];
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/**
 * Lightweight role descriptor returned by `GET /admin/users/roles`.
 */
export class RoleDto {
  @ApiProperty({ description: 'Unique role identifier', example: 'STUDENT' })
  id!: string;

  @ApiProperty({ description: 'Human-readable role name', example: 'Student' })
  name!: string;
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleDto = exports.UserWorkspaceResponseDto = exports.PaginatedActivityResponseDto = exports.UserActivityItemDto = exports.PaginatedUsersResponseDto = exports.UserStatsResponseDto = exports.UserProfileResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------
/**
 * Represents a single user's profile as returned by `GET /admin/users/:id/profile`.
 */
class UserProfileResponseDto {
}
exports.UserProfileResponseDto = UserProfileResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique user identifier', example: 'usr_abc123' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full name of the user', example: 'Jane Doe' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email address', example: 'jane.doe@example.com' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assigned role',
        example: 'STUDENT',
        enum: ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT'],
    }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current account status',
        example: 'ACTIVE',
        enum: ['PENDING_INVITATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED'],
    }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account creation timestamp', example: '2026-01-15T08:30:00.000Z' }),
    __metadata("design:type", Date)
], UserProfileResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last login timestamp (null if never logged in)',
        example: '2026-06-10T14:22:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserProfileResponseDto.prototype, "lastLoginAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last recorded activity timestamp (null if no activity)',
        example: '2026-06-12T09:15:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserProfileResponseDto.prototype, "lastActivityAt", void 0);
// ---------------------------------------------------------------------------
// User Stats
// ---------------------------------------------------------------------------
/**
 * Aggregate statistics for the admin dashboard, returned by `GET /admin/users/stats`.
 */
class UserStatsResponseDto {
}
exports.UserStatsResponseDto = UserStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of registered users', example: 150 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "totalUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of currently active users', example: 120 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "activeUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of users with an admin-level role', example: 5 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "adminUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of pending invitation users', example: 12 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "pendingInvitations", void 0);
// ---------------------------------------------------------------------------
// Paginated Users
// ---------------------------------------------------------------------------
/**
 * Paginated list of users returned by `GET /admin/users`.
 *
 * The `items` array contains plain user objects (not full profile DTOs)
 * so the shape is intentionally kept flexible.
 */
class PaginatedUsersResponseDto {
}
exports.PaginatedUsersResponseDto = PaginatedUsersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of user objects for the current page',
        type: 'array',
        items: { type: 'object' },
    }),
    __metadata("design:type", Array)
], PaginatedUsersResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of users matching the query', example: 150 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number', example: 1 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of items per page', example: 10 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "limit", void 0);
// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------
/**
 * Represents a single user-activity log entry.
 */
class UserActivityItemDto {
}
exports.UserActivityItemDto = UserActivityItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique activity entry identifier', example: 'act_xyz789' }),
    __metadata("design:type", String)
], UserActivityItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Machine-readable action key', example: 'LOGIN' }),
    __metadata("design:type", String)
], UserActivityItemDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human-readable description of the action', example: 'User logged in from 192.168.1.10' }),
    __metadata("design:type", String)
], UserActivityItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp of the activity', example: '2026-06-12T09:15:00.000Z' }),
    __metadata("design:type", Date)
], UserActivityItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional metadata associated with the activity',
        example: { ip: '192.168.1.10', userAgent: 'Mozilla/5.0' },
        required: false,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserActivityItemDto.prototype, "metadata", void 0);
/**
 * Paginated activity log returned by `GET /admin/users/:id/activity`.
 */
class PaginatedActivityResponseDto {
}
exports.PaginatedActivityResponseDto = PaginatedActivityResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of activity entries for the current page',
        type: [UserActivityItemDto],
    }),
    __metadata("design:type", Array)
], PaginatedActivityResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of activity entries', example: 42 }),
    __metadata("design:type", Number)
], PaginatedActivityResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number', example: 1 }),
    __metadata("design:type", Number)
], PaginatedActivityResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of items per page', example: 10 }),
    __metadata("design:type", Number)
], PaginatedActivityResponseDto.prototype, "limit", void 0);
// ---------------------------------------------------------------------------
// User Workspace
// ---------------------------------------------------------------------------
/** Summary of a user's activity metrics. */
class ActivitySummaryDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of recorded actions', example: 256 }),
    __metadata("design:type", Number)
], ActivitySummaryDto.prototype, "totalActions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp of the most recent activity (null if none)',
        example: '2026-06-12T09:15:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ActivitySummaryDto.prototype, "lastActivityAt", void 0);
/**
 * Composite workspace view for a single user, returned by `GET /admin/users/:id/workspace`.
 *
 * Combines the user's profile, an activity summary, and a list of recent activities.
 */
class UserWorkspaceResponseDto {
}
exports.UserWorkspaceResponseDto = UserWorkspaceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User profile information',
        type: UserProfileResponseDto,
    }),
    __metadata("design:type", UserProfileResponseDto)
], UserWorkspaceResponseDto.prototype, "profile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Aggregated activity summary',
        type: ActivitySummaryDto,
    }),
    __metadata("design:type", ActivitySummaryDto)
], UserWorkspaceResponseDto.prototype, "activitySummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Most recent activity entries',
        type: [UserActivityItemDto],
    }),
    __metadata("design:type", Array)
], UserWorkspaceResponseDto.prototype, "recentActivities", void 0);
// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------
/**
 * Lightweight role descriptor returned by `GET /admin/users/roles`.
 */
class RoleDto {
}
exports.RoleDto = RoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique role identifier', example: 'STUDENT' }),
    __metadata("design:type", String)
], RoleDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human-readable role name', example: 'Student' }),
    __metadata("design:type", String)
], RoleDto.prototype, "name", void 0);
//# sourceMappingURL=user-response.dto.js.map
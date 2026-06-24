import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Valid user account statuses for filtering. */
const ALLOWED_STATUSES = [
  'PENDING_INVITATION',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
] as const;

/** Valid sort-order directions. */
const SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Query-parameter DTO for the paginated user listing endpoint.
 *
 * All fields are optional – sensible defaults are applied when omitted.
 *
 * @example GET /admin/users?page=2&limit=25&search=john&role=STUDENT&status=ACTIVE&sortBy=email&sortOrder=asc
 */
export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Free-text search across user name and email',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    example: 'STUDENT',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    enum: ALLOWED_STATUSES,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @IsIn([...ALLOWED_STATUSES], {
    message: `status must be one of ${ALLOWED_STATUSES.join(', ')}`,
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Field name to sort results by',
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: SORT_ORDERS,
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn([...SORT_ORDERS], {
    message: `sortOrder must be one of ${SORT_ORDERS.join(', ')}`,
  })
  sortOrder: string = 'desc';
}

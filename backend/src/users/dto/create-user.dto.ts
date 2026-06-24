import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsIn,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ALLOWED_ROLES } from './update-role.dto';

/**
 * Request-body DTO for creating a new user via the admin panel.
 *
 * The `role` field is validated against the shared `ALLOWED_ROLES` constant
 * so that allowed values stay in sync with `UpdateRoleDto`.
 *
 * @example
 * {
 *   "fullName": "Jane Doe",
 *   "email": "jane.doe@example.com",
 *   "role": "STUDENT",
 *   "sendInvitation": true
 * }
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'fullName must not be empty' })
  fullName!: string;

  @ApiProperty({
    description: 'Email address (must be a valid email)',
    example: 'jane.doe@example.com',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email must not be empty' })
  email!: string;

  @ApiProperty({
    description: 'Role to assign to the new user',
    enum: ALLOWED_ROLES,
    example: 'STUDENT',
  })
  @IsString()
  @IsNotEmpty({ message: 'role must not be empty' })
  @IsIn(ALLOWED_ROLES, {
    message: `role must be one of ${ALLOWED_ROLES.join(', ')}`,
  })
  role!: string;

  @ApiProperty({
    description: 'Whether to send an invitation email upon creation',
    default: true,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'sendInvitation must be a boolean' })
  sendInvitation: boolean = true;
}

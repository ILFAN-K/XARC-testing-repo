import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export const ALLOWED_ROLES = ['MANAGER', 'USER'];

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_ROLES, {
    message: `Role must be one of ${ALLOWED_ROLES.join(', ')}`,
  })
  role!: string;
}

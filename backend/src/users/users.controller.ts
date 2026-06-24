import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('SUPERADMIN')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles('SUPERADMIN')
  updateUserRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }
  
  @Get('admin-only')
  @Roles('SUPERADMIN')
  getAdminData(@CurrentUser() user: any) {
    return {
      message: 'This is protected data only for SUPERADMIN',
      user,
    };
  }

  @Get('instructor-dashboard')
  @Roles('INSTRUCTOR', 'SUPERADMIN')
  getInstructorData(@CurrentUser() user: any) {
    return {
      message: 'This is protected data for INSTRUCTOR and SUPERADMIN',
      user,
    };
  }

  @Get('student-portal')
  @Roles('STUDENT')
  getStudentData(@CurrentUser() user: any) {
    return {
      message: 'This is protected data for STUDENT',
      user,
    };
  }
}

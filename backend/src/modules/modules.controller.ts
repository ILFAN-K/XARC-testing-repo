import { Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AssignSystemDto } from './dto/assign-system.dto';
import { AssignBulkDto } from './dto/assign-bulk.dto';
import { PurchaseLicensesDto } from './dto/purchase-licenses.dto';
import { GetAvailableModulesDto } from './dto/get-available-modules.dto';

@Controller('modules')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string,
  ) {
    // Assuming organizationId is set on req.user from auth guard
    const orgId = req.user.organizationId;
    return this.modulesService.findAll(orgId, search, filter, sort);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.modulesService.findOne(req.user.organizationId, id);
  }

  @Get(':id/available-systems')
  @Roles('SUPERADMIN', 'ADMIN')
  getAvailableSystems(@Req() req: any, @Param('id') id: string) {
    return this.modulesService.getAvailableSystems(req.user.organizationId, id);
  }

  @Post(':id/assign')
  @Roles('SUPERADMIN', 'ADMIN')
  assignSystem(@Req() req: any, @Param('id') id: string, @Body() dto: AssignSystemDto) {
    return this.modulesService.assignSystem(req.user.organizationId, id, dto, req.user.email);
  }

  @Post(':id/assign-bulk')
  @Roles('SUPERADMIN', 'ADMIN')
  assignSystemBulk(@Req() req: any, @Param('id') id: string, @Body() dto: AssignBulkDto) {
    return this.modulesService.assignModuleToSystemsBulk(req.user.organizationId, id, dto.deviceIds, req.user.email);
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles('SUPERADMIN', 'ADMIN')
  removeAssignment(@Req() req: any, @Param('id') id: string, @Param('assignmentId') assignmentId: string) {
    return this.modulesService.removeAssignment(req.user.organizationId, id, assignmentId);
  }

  @Patch(':id/licenses')
  @Roles('SUPERADMIN', 'ADMIN')
  purchaseLicenses(@Req() req: any, @Param('id') id: string, @Body() dto: PurchaseLicensesDto) {
    return this.modulesService.purchaseLicenses(req.user.organizationId, id, dto);
  }

  @Post('available-for-launch')
  @Roles('SUPERADMIN', 'ADMIN')
  getAvailableForLaunch(@Req() req: any, @Body() dto: GetAvailableModulesDto) {
    return this.modulesService.getAvailableForLaunch(req.user.organizationId, dto.deviceIds);
  }
}

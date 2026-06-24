import { Controller, Post, Get, UseGuards, Req, Body, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import type { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Req() request: Request, @Body('role') role?: string) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ success: false, message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split('Bearer ')[1];
    return this.authService.syncUser(token, role);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Get available organizations for registration' })
  getOrganizations() {
    return this.authService.getOrganizations();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user after Firebase auth' })
  async register(
    @Req() request: Request,
    @Body('fullName') fullName: string,
    @Body('organizationId') organizationId: string,
    @Body('role') role: string,
  ) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ success: false, message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split('Bearer ')[1];
    return this.authService.registerUser(token, fullName, organizationId, role);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.authService.me(user.sub);
  }

  @Get('validate-invitation/:token')
  @ApiOperation({ summary: 'Validate an invitation token and return user info' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation token' })
  validateInvitation(@Param('token') token: string) {
    return this.authService.validateInvitation(token);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept an invitation and set a password to activate the account' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation token' })
  @ApiResponse({ status: 409, description: 'Account with email already exists' })
  acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(acceptInvitationDto);
  }
}

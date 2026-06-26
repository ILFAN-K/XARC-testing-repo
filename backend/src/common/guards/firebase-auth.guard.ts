import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { firebaseAdmin } from '../../firebase/firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ success: false, message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify Firebase ID Token and enforce revocation/disabled checks
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token, true);
      
      // Look up user in PostgreSQL strictly by firebaseUid
      const user = await this.prisma.user.findFirst({
        where: {
          firebaseUid: decodedToken.uid
        },
      });

      if (!user) {
        throw new UnauthorizedException({ success: false, message: 'User not found in database. Please sync/register first.' });
      }

      // Check if user account is deleted or suspended/inactive
      if (user.isDeleted === true) {
        throw new UnauthorizedException({ success: false, message: 'Account has been deleted' });
      }
      if (user.status === 'SUSPENDED') {
        throw new UnauthorizedException({ success: false, message: 'Account is suspended' });
      }
      if (user.status === 'INACTIVE') {
        throw new UnauthorizedException({ success: false, message: 'Account is inactive' });
      }

      // Attach user to request
      request.user = {
        sub: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid,
        organizationId: user.organizationId || null,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException({ success: false, message: 'Invalid or expired Firebase token' });
    }
  }
}

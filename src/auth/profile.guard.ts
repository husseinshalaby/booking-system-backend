import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, JwtPayload } from './auth.service';
import { PROFILE_KEY } from './profile.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    const userId = request.headers['x-user-id'];
    const userType = request.headers['x-user-type'];
    
    if (!userId || !userType) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = {
      userId: parseInt(userId),
      userType: userType,
      email: request.headers['x-user-email'] || '',
    };

    const requiredUserType = this.reflector.getAllAndOverride<'customer' | 'partner'>(
      PROFILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredUserType) {
      return true;
    }

    if (userType !== requiredUserType) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredUserType}`);
    }

    return true;
  }


}

export function validateOwnership<T extends Record<string, any>>(
  user: JwtPayload,
  resource: T | null | undefined,
  userIdField: keyof T
): boolean {
  if (!resource || !resource[userIdField]) {
    return false;
  }
  
  if (user.userType === 'customer' && userIdField === 'customerId') {
    return resource[userIdField] === user.userId;
  }
  if (user.userType === 'partner' && userIdField === 'partnerId') {
    return resource[userIdField] === user.userId;
  }
  
  return false;
}
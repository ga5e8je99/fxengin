import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required. Missing administrative bearer token.');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Elevated clearance required. This critical administrative operation strictly requires SUPER_ADMIN authority.',
      );
    }

    return true;
  }
}

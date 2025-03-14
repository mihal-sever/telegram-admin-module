import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AdminContext } from '@admin/types/context';
import { adminConfig } from '@admin/admin.config';
import { NoUsernameException, NotAdminException } from '@admin/exceptions/admin.exception';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Получаем контекст Grammy из ExecutionContext
    const ctx = context.switchToHttp().getRequest<AdminContext>();

    if (!ctx.from || !ctx.from.username) {
      throw new NoUsernameException();
    }

    const isAdmin = await adminConfig.isUserAdmin(ctx.from.username);

    if (!isAdmin) {
      throw new NotAdminException();
    }

    return true;
  }
} 
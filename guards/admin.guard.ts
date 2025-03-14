import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { MyContext } from '@/types/context';
import { isUserAdmin } from '@/supabase/client';
import { NoUsernameException, NotAdminException } from '@/bot/admin/exceptions/admin.exception';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Получаем контекст Grammy из ExecutionContext
    const ctx = context.switchToHttp().getRequest<MyContext>();
    
    if (!ctx.from || !ctx.from.username) {
      throw new NoUsernameException();
    }
    
    const isAdmin = await isUserAdmin(ctx.from.username);
    
    if (!isAdmin) {
      throw new NotAdminException();
    }
    
    return true;
  }
} 
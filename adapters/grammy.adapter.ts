import type { MyContext } from '@/types/context';
import { AdminGuard } from '@/bot/admin/guards/admin.guard';
import { AdminExceptionFilter } from '@/bot/admin/filters/admin-exception.filter';
import { HttpException } from '@nestjs/common';

/**
 * Создает middleware для проверки прав администратора
 * Используется для интеграции с Grammy
 */
export function createAdminMiddleware() {
  const adminGuard = new AdminGuard();
  const exceptionFilter = new AdminExceptionFilter();
  
  return async (ctx: MyContext, next: () => Promise<void>) => {
    try {
      // Создаем mock ExecutionContext для NestJS
      const executionContext = {
        switchToHttp: () => ({
          getRequest: () => ctx,
        }),
        getType: () => 'http',
        getClass: () => ({}),
        getHandler: () => ({}),
      };
      
      if (await adminGuard.canActivate(executionContext as any)) {
        return next();
      }
    } catch (error) {
      // Используем фильтр исключений для обработки ошибок
      await exceptionFilter.catch(error instanceof Error ? error : new HttpException('Ошибка доступа', 403), {
        switchToHttp: () => ({
          getRequest: () => ctx,
        }),
      } as any);
    }
  };
} 
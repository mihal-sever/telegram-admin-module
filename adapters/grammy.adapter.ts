import type { AdminContext } from '@admin/types/context';
import { AdminGuard } from '@admin/guards/admin.guard';
import { AdminExceptionFilter } from '@admin/filters/admin-exception.filter';
import { HttpException } from '@nestjs/common';

/**
 * Создает middleware для проверки прав администратора
 * Используется для интеграции с Grammy
 */
export function createAdminMiddleware() {
  const adminGuard = new AdminGuard();
  const exceptionFilter = new AdminExceptionFilter();

  return async (ctx: AdminContext, next: () => Promise<void>) => {
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
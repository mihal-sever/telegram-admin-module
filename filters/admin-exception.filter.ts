import { Injectable } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { AdminContext } from '@admin/types/context';
import { EmptyPasswordException } from '@admin/exceptions/password.exception';
import { EmptyUsernameException } from '@admin/exceptions/username.exception';

@Injectable()
export class AdminExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp().getRequest<AdminContext>();

    // Получаем статус и сообщение из исключения
    let status = 500;
    let message = exception.message || 'Произошла непредвиденная ошибка';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }

    console.error(`Admin error [${status}]: ${message}`);

    // Отправляем сообщение пользователю
    await ctx.reply(`❌ ${message}`);

    // Для диалогов можно прервать выполнение
    if (ctx.conversation) {
      // Если это диалог, можно его завершить
      // ctx.conversation.exit() - если нужно завершить диалог
    }
  }

  /**
   * Обрабатывает различные типы ошибок и вызывает метод catch
   * @param ctx Контекст бота
   * @param error Ошибка
   * @param defaultMessage Сообщение по умолчанию
   * @param defaultStatusCode Статус-код по умолчанию
   */
  async handleError(
    ctx: AdminContext,
    error: unknown,
    defaultMessage: string = 'Непредвиденная ошибка',
    defaultStatusCode: number = 500
  ): Promise<void> {
    // Определяем тип ошибки и формируем соответствующее сообщение
    let errorMessage = defaultMessage;
    let statusCode = defaultStatusCode;

    if (error instanceof EmptyPasswordException ||
      error instanceof EmptyUsernameException) {
      errorMessage = (error as HttpException).message;
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = `${defaultMessage}: ${error.message}`;
    }

    // Используем метод catch для обработки ошибок
    await this.catch(
      error instanceof HttpException ? error : new HttpException(errorMessage, statusCode),
      {
        switchToHttp: () => ({
          getRequest: () => ctx,
        }),
      } as ArgumentsHost
    );
  }
} 
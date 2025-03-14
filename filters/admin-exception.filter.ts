import { Injectable } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import type { MyContext } from '@/types/context';
import { createMainMenu } from '@/bot/keyboards';

@Injectable()
export class AdminExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp().getRequest<MyContext>();
    
    // Получаем статус и сообщение из исключения
    let status = 500;
    let message = exception.message || 'Произошла непредвиденная ошибка';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }
    
    console.error(`Admin error [${status}]: ${message}`);
    
    // Отправляем сообщение пользователю
    await ctx.reply(`❌ ${message}`, { 
      reply_markup: createMainMenu() 
    });
    
    // Для диалогов можно прервать выполнение
    if (ctx.conversation) {
      // Если это диалог, можно его завершить
      // ctx.conversation.exit() - если нужно завершить диалог
    }
  }
} 
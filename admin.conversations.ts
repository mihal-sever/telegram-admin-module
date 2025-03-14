import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '@/types/context';
import { createMainMenu } from '@/bot/keyboards';
import { AdminService } from '@/bot/admin/services/admin.service';
import { PasswordValidationPipe } from '@/bot/admin/pipes/password.pipe';
import { AdminExceptionFilter } from '@/bot/admin/filters/admin-exception.filter';
import { EmptyPasswordException } from '@/bot/admin/exceptions/password.exception';
import { HttpException } from '@nestjs/common';
import { adminConfig } from '@/bot/admin/admin.config';

// Инъекция зависимостей (в реальном NestJS приложении это делается через конструктор)
const adminService = new AdminService();
const passwordPipe = new PasswordValidationPipe();
const exceptionFilter = new AdminExceptionFilter();

/**
 * Базовый класс для административных диалогов
 */
abstract class AdminConversation {
  /**
   * Проверяет, является ли пользователь администратором
   * @param ctx Контекст бота
   * @returns true, если пользователь является администратором
   */
  async isUserAdmin(ctx: MyContext): Promise<boolean> {
    if (!ctx.from?.username) {
      return false;
    }
    
    return await adminConfig.isUserAdmin(ctx.from.username);
  }
  
  /**
   * Проверяет права доступа: если пользователь администратор - доступ без пароля,
   * иначе запрашивает пароль
   * @param conversation Объект диалога
   * @param ctx Контекст бота
   * @returns true, если доступ разрешен
   */
  async checkAccess(conversation: Conversation<MyContext>, ctx: MyContext): Promise<boolean> {
    // Проверяем, является ли пользователь администратором
    const isAdmin = await this.isUserAdmin(ctx);
    
    if (isAdmin) {
      // Администраторам доступ без пароля
      return true;
    }
    
    // Для не-администраторов запрашиваем пароль
    return await this.validatePassword(conversation, ctx);
  }
  
  /**
   * Запрашивает и проверяет пароль
   * @param conversation Объект диалога
   * @param ctx Контекст бота
   * @returns true, если пароль верный
   */
  async validatePassword(conversation: Conversation<MyContext>, ctx: MyContext): Promise<boolean> {
    await ctx.reply('Пожалуйста, введите пароль для доступа к панели администратора:');
    const passwordMsg = await conversation.wait();
    
    try {
      // Используем pipe для валидации пароля
      passwordPipe.transform(passwordMsg.message?.text || "", {} as any);
      return true;
    } catch (error) {
      // Используем фильтр исключений для обработки ошибок
      await handleError(ctx, error, 'Ошибка валидации', 400);
      return false;
    }
  }
}

/**
 * Обработка ошибок с использованием фильтра исключений
 * @param ctx Контекст бота
 * @param error Ошибка
 * @param defaultMessage Сообщение по умолчанию
 * @param defaultStatusCode Статус-код по умолчанию
 */
async function handleError(
  ctx: MyContext, 
  error: unknown, 
  defaultMessage: string = 'Непредвиденная ошибка', 
  defaultStatusCode: number = 500
): Promise<void> {
  // Определяем тип ошибки и формируем соответствующее сообщение
  let errorMessage = defaultMessage;
  let statusCode = defaultStatusCode;
  
  if (error instanceof EmptyPasswordException) {
    errorMessage = error.message;
    statusCode = 400;
  } else if (error instanceof Error) {
    errorMessage = `${defaultMessage}: ${error.message}`;
  }
  
  // Используем фильтр исключений для обработки ошибок
  await exceptionFilter.catch(
    error instanceof HttpException ? error : new HttpException(errorMessage, statusCode), 
    {
      switchToHttp: () => ({
        getRequest: () => ctx,
      }),
    } as any
  );
}

/**
 * Запрашивает username пользователя
 * @param conversation Объект диалога
 * @param ctx Контекст бота
 * @param promptMessage Сообщение для запроса
 * @returns Введенный пользователем username
 */
async function promptUsername(
  conversation: Conversation<MyContext>, 
  ctx: MyContext,
  promptMessage: string
): Promise<string> {
  await ctx.reply(promptMessage);
  const usernameMsg = await conversation.wait();
  
  if (!usernameMsg.message?.text) {
    throw new EmptyPasswordException();
  }
  
  return usernameMsg.message.text;
}

/**
 * Отправляет сообщение об успешном выполнении операции
 * @param ctx Контекст бота
 * @param message Сообщение об успехе
 */
async function sendSuccessMessage(ctx: MyContext, message: string): Promise<void> {
  await ctx.reply(message, { 
    reply_markup: createMainMenu() 
  });
}

/**
 * Диалог для создания администратора
 */
export async function makeAdminConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
) {
  const adminConversation = new class extends AdminConversation {};
  
  try {
    // Проверяем доступ (администратор или пароль)
    if (!await adminConversation.checkAccess(conversation, ctx)) {
      return;
    }
    
    // Запрашиваем username
    const username = await promptUsername(
      conversation, 
      ctx, 
      'Пожалуйста, введите username пользователя (с символом @ или без):'
    );
    
    // Используем сервис для бизнес-логики
    await adminService.makeAdmin(username);
    
    // Отправляем сообщение об успешном выполнении
    await sendSuccessMessage(
      ctx, 
      `✅ Пользователь @${username.replace(/^@/, '')} успешно получил права администратора.`
    );
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при назначении администратора');
  }
}

/**
 * Диалог для удаления прав администратора
 */
export async function removeAdminConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
) {
  const adminConversation = new class extends AdminConversation {};
  
  try {
    // Проверяем доступ (администратор или пароль)
    if (!await adminConversation.checkAccess(conversation, ctx)) {
      return;
    }
    
    // Запрашиваем username
    const username = await promptUsername(
      conversation, 
      ctx, 
      'Пожалуйста, введите username пользователя, у которого нужно удалить права администратора (с символом @ или без):'
    );
    
    // Используем сервис для бизнес-логики
    await adminService.removeAdmin(
      username,
      ctx.from?.username
    );
    
    // Отправляем сообщение об успешном выполнении
    await sendSuccessMessage(
      ctx, 
      `✅ Права администратора для пользователя @${username.replace(/^@/, '')} успешно удалены.`
    );
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при удалении прав администратора');
  }
}

/**
 * Диалог для просмотра списка администраторов
 */
export async function listAdminsConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
) {
  const adminConversation = new class extends AdminConversation {};
  
  try {
    // Проверяем доступ (администратор или пароль)
    if (!await adminConversation.checkAccess(conversation, ctx)) {
      return;
    }
    
    // Используем сервис для бизнес-логики
    const admins = await adminService.listAdmins();
    
    if (admins.length === 0) {
      await sendSuccessMessage(ctx, 'В системе нет администраторов.');
      return;
    }
    
    const adminsList = admins.map((admin: string) => `@${admin}`).join('\n');
    
    await sendSuccessMessage(ctx, `Список администраторов:\n\n${adminsList}`);
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при получении списка администраторов');
  }
} 
import type { Conversation } from '@grammyjs/conversations';
import { AdminContext } from '@admin/types/context';
import { AdminService } from '@admin/services/admin.service';
import { PasswordValidationPipe } from '@admin/pipes/password.pipe';
import { UsernameValidationPipe } from '@admin/pipes/username.pipe';
import { AdminExceptionFilter } from '@admin/filters/admin-exception.filter';
import { AdminGuard } from '@admin/guards/admin.guard';
import { SessionService } from '../services/session.service';
import { Injectable } from '@nestjs/common';

// Инъекция зависимостей (в реальном NestJS приложении это делается через конструктор)
const adminService = new AdminService();
const passwordPipe = new PasswordValidationPipe();
const usernamePipe = new UsernameValidationPipe();
const exceptionFilter = new AdminExceptionFilter();
const adminGuard = new AdminGuard();

@Injectable()
export class AdminConversationBase {
  constructor(private readonly sessionService: SessionService) { }

  /**
   * Проверяет права доступа: если пользователь администратор - доступ без пароля,
   * иначе запрашивает пароль
   * @param conversation Объект диалога
   * @param ctx Контекст бота
   * @returns true, если доступ разрешен
   */
  async checkAccess(conversation: Conversation<AdminContext>, ctx: AdminContext): Promise<boolean> {
    // Инициализируем сессию и adminData
    this.sessionService.ensureAdminData(ctx);

    // Проверяем, является ли пользователь администратором
    let isAdmin = false;
    try {
      // Используем AdminGuard для проверки прав администратора
      isAdmin = await adminGuard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ctx
        })
      } as any);
    } catch (error) {
      // Если возникла ошибка, значит пользователь не администратор
      isAdmin = false;
    }

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
  async validatePassword(conversation: Conversation<AdminContext>, ctx: AdminContext): Promise<boolean> {
    await ctx.reply('Пожалуйста, введите пароль для доступа к панели администратора:');
    const passwordMsg = await conversation.wait();

    try {
      // Используем pipe для валидации пароля
      passwordPipe.transform(passwordMsg.message?.text || "", {} as any);
      return true;
    } catch (error) {
      // Используем фильтр исключений для обработки ошибок
      await exceptionFilter.handleError(ctx, error, 'Ошибка валидации', 400);
      return false;
    }
  }
}

// Для обратной совместимости
const sessionServiceInstance = new SessionService();
const adminConversationBase = new AdminConversationBase(sessionServiceInstance);

@Injectable()
export class AdminConversations {
  constructor(private readonly sessionService: SessionService) { }

  async makeAdminConversation(
    conversation: Conversation<AdminContext>,
    ctx: AdminContext
  ) {
    try {
      // Инициализируем adminData
      this.sessionService.ensureAdminData(ctx);

      // Если userId не установлен в сессии, но есть в adminData, восстанавливаем его
      if (!(ctx as any).session.userId && (ctx as any).session.adminData.userId) {
        (ctx as any).session.userId = (ctx as any).session.adminData.userId;
        console.log(`Restored userId ${(ctx as any).session.userId} from adminData`);
      }

      // Проверяем доступ
      const hasAccess = await adminConversationBase.checkAccess(conversation, ctx);
      if (!hasAccess) {
        await ctx.reply('❌ Доступ запрещен. Неверный пароль.');
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
        `✅ Пользователь @${username} успешно получил права администратора.`
      );
    } catch (error) {
      await exceptionFilter.handleError(ctx, error, 'Ошибка при назначении администратора');
    }
  }

  async removeAdminConversation(
    conversation: Conversation<AdminContext>,
    ctx: AdminContext
  ) {
    try {
      // Инициализируем adminData
      this.sessionService.ensureAdminData(ctx);

      // Если userId не установлен в сессии, но есть в adminData, восстанавливаем его
      if (!(ctx as any).session.userId && (ctx as any).session.adminData.userId) {
        (ctx as any).session.userId = (ctx as any).session.adminData.userId;
        console.log(`Restored userId ${(ctx as any).session.userId} from adminData`);
      }

      // Проверяем доступ
      const hasAccess = await adminConversationBase.checkAccess(conversation, ctx);
      if (!hasAccess) {
        await ctx.reply('❌ Доступ запрещен. Неверный пароль.');
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
        `✅ Права администратора для пользователя @${username} успешно удалены.`
      );
    } catch (error) {
      await exceptionFilter.handleError(ctx, error, 'Ошибка при удалении прав администратора');
    }
  }

  async listAdminsConversation(
    conversation: Conversation<AdminContext>,
    ctx: AdminContext
  ) {
    try {
      // Инициализируем adminData
      this.sessionService.ensureAdminData(ctx);

      // Если userId не установлен в сессии, но есть в adminData, восстанавливаем его
      if (!(ctx as any).session.userId && (ctx as any).session.adminData.userId) {
        (ctx as any).session.userId = (ctx as any).session.adminData.userId;
        console.log(`Restored userId ${(ctx as any).session.userId} from adminData`);
      }

      // Проверяем доступ
      const hasAccess = await adminConversationBase.checkAccess(conversation, ctx);
      if (!hasAccess) {
        await ctx.reply('❌ Доступ запрещен. Неверный пароль.');
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
      await exceptionFilter.handleError(ctx, error, 'Ошибка при получении списка администраторов');
    }
  }
}

// Экспортируем функции-обертки для обратной совместимости
export async function makeAdminConversation(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext
) {
  const adminConversations = new AdminConversations(sessionServiceInstance);
  await adminConversations.makeAdminConversation(conversation, ctx);
}

export async function removeAdminConversation(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext
) {
  const adminConversations = new AdminConversations(sessionServiceInstance);
  await adminConversations.removeAdminConversation(conversation, ctx);
}

export async function listAdminsConversation(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext
) {
  const adminConversations = new AdminConversations(sessionServiceInstance);
  await adminConversations.listAdminsConversation(conversation, ctx);
}

/**
 * Запрашивает username пользователя и нормализует его
 * @param conversation Объект диалога
 * @param ctx Контекст бота
 * @param promptMessage Сообщение для запроса
 * @returns Обработанный username пользователя
 */
async function promptUsername(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext,
  promptMessage: string
): Promise<string> {
  await ctx.reply(promptMessage);
  const usernameMsg = await conversation.wait();

  // Используем пайп для валидации и нормализации имени пользователя
  // Если текст сообщения отсутствует, пайп выбросит EmptyUsernameException
  return usernamePipe.transform(usernameMsg.message?.text || "", {} as any);
}

/**
 * Отправляет сообщение об успешном выполнении операции
 * @param ctx Контекст бота
 * @param message Сообщение об успехе
 */
async function sendSuccessMessage(ctx: AdminContext, message: string): Promise<void> {
  await ctx.reply(message);
} 
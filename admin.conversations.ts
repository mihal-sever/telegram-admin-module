import type { Conversation } from '@grammyjs/conversations';
import { AdminContext } from '@admin/types/context';
import { AdminService } from '@admin/services/admin.service';
import { PasswordValidationPipe } from '@admin/pipes/password.pipe';
import { UsernameValidationPipe } from '@admin/pipes/username.pipe';
import { AdminExceptionFilter } from '@admin/filters/admin-exception.filter';
import { AdminGuard } from '@admin/guards/admin.guard';

// Инъекция зависимостей (в реальном NestJS приложении это делается через конструктор)
const adminService = new AdminService();
const passwordPipe = new PasswordValidationPipe();
const usernamePipe = new UsernameValidationPipe();
const exceptionFilter = new AdminExceptionFilter();
const adminGuard = new AdminGuard();

/**
 * Базовый класс для административных диалогов
 */
abstract class AdminConversation {
  /**
   * Проверяет права доступа: если пользователь администратор - доступ без пароля,
   * иначе запрашивает пароль
   * @param conversation Объект диалога
   * @param ctx Контекст бота
   * @returns true, если доступ разрешен
   */
  async checkAccess(conversation: Conversation<AdminContext>, ctx: AdminContext): Promise<boolean> {
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

/**
 * Диалог для создания администратора
 */
export async function makeAdminConversation(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext
) {
  const adminConversation = new class extends AdminConversation { };

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
      `✅ Пользователь @${username} успешно получил права администратора.`
    );
  } catch (error) {
    await exceptionFilter.handleError(ctx, error, 'Ошибка при назначении администратора');
  }
}

/**
 * Диалог для удаления прав администратора
 */
export async function removeAdminConversation(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext
) {
  const adminConversation = new class extends AdminConversation { };

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
      `✅ Права администратора для пользователя @${username} успешно удалены.`
    );
  } catch (error) {
    await exceptionFilter.handleError(ctx, error, 'Ошибка при удалении прав администратора');
  }
}

/**
 * Диалог для просмотра списка администраторов
 */
export async function listAdminsConversation(
  conversation: Conversation<AdminContext>,
  ctx: AdminContext
) {
  const adminConversation = new class extends AdminConversation { };

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
    await exceptionFilter.handleError(ctx, error, 'Ошибка при получении списка администраторов');
  }
} 
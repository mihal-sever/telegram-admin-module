import { AdminContext } from '@admin/types/context';
import { SessionService } from '../services/session.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminCommandHandler {
  constructor(private readonly sessionService: SessionService) { }

  /**
   * Обработчик команды /makeAdmin
   * Запускает диалог для создания администратора с защитой паролем
   */
  async handleMakeAdminCommand(ctx: AdminContext) {
    // Подготавливаем контекст для диалога
    this.sessionService.prepareForConversation(ctx);

    await ctx.reply("Начинаем процесс назначения администратора...");
    await ctx.conversation.enter("makeAdmin");
  }

  /**
   * Обработчик команды /removeAdmin
   * Запускает диалог для удаления прав администратора с защитой паролем
   */
  async handleRemoveAdminCommand(ctx: AdminContext) {
    // Подготавливаем контекст для диалога
    this.sessionService.prepareForConversation(ctx);

    await ctx.reply("Начинаем процесс удаления прав администратора...");
    await ctx.conversation.enter("removeAdmin");
  }

  /**
   * Обработчик команды /listAdmins
   * Запускает диалог для просмотра списка администраторов с защитой паролем
   */
  async handleListAdminsCommand(ctx: AdminContext) {
    // Подготавливаем контекст для диалога
    this.sessionService.prepareForConversation(ctx);

    await ctx.reply("Начинаем процесс просмотра списка администраторов...");
    await ctx.conversation.enter("listAdmins");
  }
}

// Экспортируем функции-обертки для обратной совместимости
export async function handleMakeAdminCommand(ctx: AdminContext) {
  const handler = new AdminCommandHandler(new SessionService());
  await handler.handleMakeAdminCommand(ctx);
}

export async function handleRemoveAdminCommand(ctx: AdminContext) {
  const handler = new AdminCommandHandler(new SessionService());
  await handler.handleRemoveAdminCommand(ctx);
}

export async function handleListAdminsCommand(ctx: AdminContext) {
  const handler = new AdminCommandHandler(new SessionService());
  await handler.handleListAdminsCommand(ctx);
} 
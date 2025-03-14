import type { MyContext } from '@/types/context';

/**
 * Обработчик команды /makeAdmin
 * Запускает диалог для создания администратора с защитой паролем
 */
export async function handleMakeAdminCommand(ctx: MyContext) {
  await ctx.reply("Начинаем процесс назначения администратора...");
  await ctx.conversation.enter("makeAdmin");
}

/**
 * Обработчик команды /removeAdmin
 * Запускает диалог для удаления прав администратора с защитой паролем
 */
export async function handleRemoveAdminCommand(ctx: MyContext) {
  await ctx.reply("Начинаем процесс удаления прав администратора...");
  await ctx.conversation.enter("removeAdmin");
}

/**
 * Обработчик команды /listAdmins
 * Запускает диалог для просмотра списка администраторов с защитой паролем
 */
export async function handleListAdminsCommand(ctx: MyContext) {
  await ctx.reply("Начинаем процесс просмотра списка администраторов...");
  await ctx.conversation.enter("listAdmins");
} 
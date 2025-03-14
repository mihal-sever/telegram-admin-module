import { Injectable } from '@nestjs/common';
import {
  AdminCreationException,
  AdminRemovalException,
  AdminNotFoundException,
  SelfRemovalException
} from '@admin/exceptions/admin.exception';
import { adminConfig } from '@admin/admin.config';

@Injectable()
export class AdminService {
  /**
   * Назначает пользователя администратором
   */
  async makeAdmin(username: string): Promise<boolean> {
    // Нормализуем username (удаляем @ если есть)
    const normalizedUsername = username.replace(/^@/, '');

    try {
      const success = await adminConfig.setUserAdminStatus(normalizedUsername, true);

      if (!success) {
        throw new AdminCreationException(normalizedUsername);
      }

      return true;
    } catch (error) {
      // Если это наше кастомное исключение, пробрасываем его дальше
      if (error instanceof AdminCreationException) {
        throw error;
      }

      // Иначе оборачиваем в наше исключение
      throw new AdminCreationException(normalizedUsername);
    }
  }

  /**
   * Удаляет права администратора у пользователя
   */
  async removeAdmin(username: string, currentUsername?: string): Promise<boolean> {
    // Нормализуем username (удаляем @ если есть)
    const normalizedUsername = username.replace(/^@/, '');
    const normalizedCurrentUsername = currentUsername?.replace(/^@/, '');

    // Проверяем, не пытается ли администратор удалить сам себя
    if (normalizedCurrentUsername && normalizedUsername === normalizedCurrentUsername) {
      throw new SelfRemovalException();
    }

    // Проверяем, является ли пользователь администратором
    const isAdmin = await adminConfig.isUserAdmin(normalizedUsername);

    if (!isAdmin) {
      throw new AdminNotFoundException(normalizedUsername);
    }

    try {
      const success = await adminConfig.setUserAdminStatus(normalizedUsername, false);

      if (!success) {
        throw new AdminRemovalException(normalizedUsername);
      }

      return true;
    } catch (error) {
      // Если это наше кастомное исключение, пробрасываем его дальше
      if (error instanceof AdminRemovalException) {
        throw error;
      }

      // Иначе оборачиваем в наше исключение
      throw new AdminRemovalException(normalizedUsername);
    }
  }

  /**
   * Получает список всех администраторов
   */
  async listAdmins(): Promise<string[]> {
    return await adminConfig.getAllAdmins();
  }
} 
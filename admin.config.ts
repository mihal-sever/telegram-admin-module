/**
 * Конфигурация модуля администрирования
 */
export interface AdminModuleConfig {
  /**
   * Пароль для доступа к административным функциям
   */
  password: string;
  
  /**
   * Функция для проверки, является ли пользователь администратором
   * @param username Username пользователя
   * @returns Promise<boolean> - true, если пользователь является администратором
   */
  isUserAdmin: (username: string) => Promise<boolean>;
  
  /**
   * Функция для установки статуса администратора
   * @param username Username пользователя
   * @param isAdmin Флаг, указывающий, является ли пользователь администратором
   * @returns Promise<boolean> - true, если статус успешно установлен
   */
  setUserAdminStatus: (username: string, isAdmin: boolean) => Promise<boolean>;
  
  /**
   * Функция для получения списка всех администраторов
   * @returns Promise<string[]> - массив имен пользователей с правами администратора
   */
  getAllAdmins: () => Promise<string[]>;
}

/**
 * Глобальная конфигурация модуля администрирования
 * Должна быть инициализирована перед использованием модуля
 */
export let adminConfig: AdminModuleConfig;

/**
 * Инициализирует конфигурацию модуля администрирования
 * @param config Конфигурация модуля
 */
export function initAdminModule(config: AdminModuleConfig): void {
  adminConfig = config;
} 
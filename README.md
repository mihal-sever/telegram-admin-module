# Модуль администрирования для Telegram ботов

Модуль предоставляет функциональность для управления администраторами в Telegram ботах, построенных с использованием Grammy и NestJS.

## Возможности

- Защита административных функций паролем
- Автоматическое определение администраторов (без запроса пароля)
- Добавление и удаление администраторов
- Просмотр списка администраторов
- Интеграция с Grammy и NestJS

## Установка

### Как Git подмодуль

```bash
git submodule add https://github.com/yourusername/admin-module.git src/bot/admin
git submodule update --init --recursive
```

## Использование

### 1. Инициализация модуля

Перед использованием модуля необходимо инициализировать его конфигурацию:

```typescript
import { initAdminModule } from '@admin/admin.config';
import { supabase } from '@/supabase/client';

// Инициализация модуля с конфигурацией
initAdminModule({
  // Пароль для доступа к административным функциям
  password: process.env.ADMIN_PASSWORD || 'default_password',
  
  // Функция для проверки, является ли пользователь администратором
  isUserAdmin: async (username: string) => {
    // Пример реализации с Supabase
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    
    return !!data && !error;
  },
  
  // Функция для установки статуса администратора
  setUserAdminStatus: async (username: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        // Добавление администратора
        const { error } = await supabase
          .from('admins')
          .upsert({ username, created_at: new Date().toISOString() });
        
        return !error;
      } else {
        // Удаление администратора
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('username', username);
        
        return !error;
      }
    } catch (error) {
      console.error('Error setting admin status:', error);
      return false;
    }
  },
  
  // Функция для получения списка всех администраторов
  getAllAdmins: async () => {
    const { data, error } = await supabase
      .from('admins')
      .select('username');
    
    if (error || !data) {
      return [];
    }
    
    return data.map(admin => admin.username);
  }
});
```

### 2. Регистрация диалогов

```typescript
import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { 
  makeAdminConversation,
  removeAdminConversation,
  listAdminsConversation
} from '@admin/admin.conversations';

// Создание бота
const bot = new Bot(process.env.BOT_TOKEN);

// Настройка сессии и диалогов
bot.use(session());
bot.use(conversations());

// Регистрация диалогов администрирования
bot.use(createConversation(makeAdminConversation, "makeAdmin"));
bot.use(createConversation(removeAdminConversation, "removeAdmin"));
bot.use(createConversation(listAdminsConversation, "listAdmins"));
```

### 3. Регистрация команд

```typescript
import { Composer } from 'grammy';
import { createAdminMiddleware } from '@admin/adapters/grammy.adapter';
import { 
  handleMakeAdminCommand,
  handleRemoveAdminCommand,
  handleListAdminsCommand
} from '@admin/commands';

// Создание middleware для проверки прав администратора
const adminMiddleware = createAdminMiddleware();

// Создание композиции для административных команд
const adminCommands = new Composer();

// Применение middleware проверки прав администратора
adminCommands.use(adminMiddleware);

// Регистрация команд только для администраторов
adminCommands.command("makeAdmin", handleMakeAdminCommand);
adminCommands.command("removeAdmin", handleRemoveAdminCommand);
adminCommands.command("listAdmins", handleListAdminsCommand);

// Добавление композиции к боту
bot.use(adminCommands);
```

## Структура модуля

```
admin/
├── adapters/               # Адаптеры для интеграции с Grammy
│   └── grammy.adapter.ts
├── exceptions/             # Исключения
│   ├── admin.exception.ts
│   └── password.exception.ts
├── filters/                # Фильтры исключений
│   └── admin-exception.filter.ts
├── guards/                 # Guards для проверки прав
│   └── admin.guard.ts
├── pipes/                  # Pipes для валидации
│   └── password.pipe.ts
├── services/               # Сервисы для бизнес-логики
│   └── admin.service.ts
├── admin.config.ts         # Конфигурация модуля
├── admin.conversations.ts  # Диалоги для административных функций
├── admin.module.ts         # Модуль NestJS
├── commands.ts             # Обработчики команд
└── README.md               # Документация
```

## Лицензия

MIT 
import { HttpException, HttpStatus } from '@nestjs/common';

export class AdminNotFoundException extends HttpException {
  constructor(username: string) {
    super(`Пользователь @${username} не является администратором`, HttpStatus.NOT_FOUND);
  }
}

export class AdminCreationException extends HttpException {
  constructor(username: string) {
    super(`Не удалось установить права администратора для пользователя @${username}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class AdminRemovalException extends HttpException {
  constructor(username: string) {
    super(`Не удалось удалить права администратора для пользователя @${username}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class SelfRemovalException extends HttpException {
  constructor() {
    super('Вы не можете удалить права администратора у самого себя', HttpStatus.BAD_REQUEST);
  }
}

export class NoUsernameException extends HttpException {
  constructor() {
    super('У вас не установлен username в Telegram. Пожалуйста, установите username в настройках Telegram и попробуйте снова', HttpStatus.BAD_REQUEST);
  }
}

export class NotAdminException extends HttpException {
  constructor() {
    super('У вас нет прав администратора для выполнения этой команды', HttpStatus.FORBIDDEN);
  }
} 
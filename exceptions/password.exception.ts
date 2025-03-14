import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidPasswordException extends HttpException {
  constructor() {
    super('Неверный пароль. Доступ запрещен.', HttpStatus.UNAUTHORIZED);
  }
}

export class EmptyPasswordException extends HttpException {
  constructor() {
    super('Пожалуйста, отправьте текстовый пароль.', HttpStatus.BAD_REQUEST);
  }
} 
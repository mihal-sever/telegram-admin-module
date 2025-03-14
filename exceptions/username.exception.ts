import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Исключение, выбрасываемое при пустом имени пользователя
 */
export class EmptyUsernameException extends HttpException {
    constructor() {
        super('Имя пользователя не может быть пустым', HttpStatus.BAD_REQUEST);
    }
} 
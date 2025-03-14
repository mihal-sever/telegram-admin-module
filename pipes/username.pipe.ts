import { Injectable } from '@nestjs/common';
import type { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { EmptyUsernameException } from '@admin/exceptions/username.exception';

/**
 * Пайп для валидации и нормализации имени пользователя
 * Удаляет символ @ в начале имени и проверяет, что имя не пустое
 */
@Injectable()
export class UsernameValidationPipe implements PipeTransform {
    transform(value: string, metadata: ArgumentMetadata): string {
        if (!value || value.trim() === '') {
            throw new EmptyUsernameException();
        }

        // Удаляем символ @ в начале имени пользователя
        return value.replace(/^@/, '');
    }
} 
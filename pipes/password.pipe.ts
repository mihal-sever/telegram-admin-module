import { Injectable } from '@nestjs/common';
import type { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { EmptyPasswordException, InvalidPasswordException } from '@/bot/admin/exceptions/password.exception';
import { adminConfig } from '@/bot/admin/admin.config';

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new EmptyPasswordException();
    }
    
    if (value !== adminConfig.password) {
      throw new InvalidPasswordException();
    }
    
    return value;
  }
} 
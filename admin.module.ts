import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { AdminService } from '@/bot/admin/services/admin.service';
import { AdminGuard } from '@/bot/admin/guards/admin.guard';
import { PasswordValidationPipe } from '@/bot/admin/pipes/password.pipe';
import { AdminExceptionFilter } from '@/bot/admin/filters/admin-exception.filter';

@Module({})
export class AdminModule {
  static register(options?: any): DynamicModule {
    return {
      module: AdminModule,
      providers: [
        AdminService,
        AdminGuard,
        PasswordValidationPipe,
        AdminExceptionFilter,
      ],
      exports: [
        AdminService,
        AdminGuard,
        PasswordValidationPipe,
        AdminExceptionFilter,
      ],
    };
  }
} 
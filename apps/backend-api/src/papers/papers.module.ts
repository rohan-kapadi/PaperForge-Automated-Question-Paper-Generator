import { Module } from '@nestjs/common';
import { PapersController } from './papers.controller';
import { PapersService } from './papers.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [SupabaseModule, SettingsModule, AuditModule],
    controllers: [PapersController],
    providers: [PapersService],
    exports: [PapersService],
})
export class PapersModule { }

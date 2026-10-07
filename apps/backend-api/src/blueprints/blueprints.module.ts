import { Module } from '@nestjs/common';
import { BlueprintsController } from './blueprints.controller';
import { BlueprintsService } from './blueprints.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    controllers: [BlueprintsController],
    providers: [BlueprintsService],
    exports: [BlueprintsService],
})
export class BlueprintsModule { }

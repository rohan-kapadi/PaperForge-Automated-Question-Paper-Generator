import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and Key must be provided in environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }

    getClientForUser(jwt: string): SupabaseClient {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
        const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

        return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            },
        });
    }

    getAdminClient(): SupabaseClient {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (serviceRoleKey) {
            return createClient(supabaseUrl, serviceRoleKey);
        }
        return this.supabase;
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface SettingItem {
    key: string;
    value: string;
    updated_at?: string;
}

export const DEFAULT_SETTINGS: Record<string, string> = {
    trust_name: "Pimpri Chinchwad Education Trust's",
    college_name: 'Pimpri Chinchwad College of Engineering & Research Ravet, Pune',
    affiliation: 'An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified',
    iqac_text: 'IQAC PCCOER',
    record_no: 'ACAD/R/11',
    department: 'Computer Engineering',
    default_duration_minutes: '60',
    academic_year: '2025 – 26',
};

@Injectable()
export class SettingsService {
    private readonly logger = new Logger(SettingsService.name);
    // In-memory fallback cache seeded with official defaults
    private cache: Record<string, string> = { ...DEFAULT_SETTINGS };

    constructor(private supabaseService: SupabaseService) { }

    /**
     * Retrieve all institution settings as an array of { key, value }
     */
    async getAll(): Promise<SettingItem[]> {
        const map = await this.getSettingsMap();
        return Object.entries(map).map(([key, value]) => ({ key, value }));
    }

    /**
     * Retrieve all settings merged into a key-value dictionary
     */
    async getSettingsMap(): Promise<Record<string, string>> {
        try {
            const client = this.supabaseService.getClient();
            const { data, error } = await client
                .from('institution_settings')
                .select('key, value');

            if (error) {
                this.logger.warn(`Could not load settings from DB: ${error.message}. Using cache.`);
                return { ...this.cache };
            }

            if (data && Array.isArray(data)) {
                for (const item of data) {
                    if (item.key) {
                        this.cache[item.key] = item.value ?? '';
                    }
                }
            }
        } catch (err: any) {
            this.logger.warn(`Error fetching settings: ${err.message}. Using cache.`);
        }

        return { ...this.cache };
    }

    /**
     * Get a single setting by key
     */
    async get(key: string): Promise<string> {
        const map = await this.getSettingsMap();
        return map[key] ?? DEFAULT_SETTINGS[key] ?? '';
    }

    /**
     * Update or insert a single setting key-value pair
     */
    async update(key: string, value: string): Promise<{ success: boolean; key: string; value: string }> {
        this.cache[key] = value;
        try {
            const client = this.supabaseService.getClient();
            const { error } = await client
                .from('institution_settings')
                .upsert(
                    {
                        key,
                        value,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'key' }
                );

            if (error) {
                this.logger.warn(`Could not persist setting '${key}' to DB: ${error.message}`);
            }
        } catch (err: any) {
            this.logger.warn(`Error updating setting '${key}': ${err.message}`);
        }

        return { success: true, key, value };
    }

    /**
     * Update multiple settings in bulk (supports either an object or an array)
     */
    async updateMany(
        payload: Record<string, string> | { key: string; value: string }[]
    ): Promise<Record<string, string>> {
        const updates: { key: string; value: string; updated_at: string }[] = [];

        if (Array.isArray(payload)) {
            for (const item of payload) {
                if (item.key) {
                    this.cache[item.key] = item.value ?? '';
                    updates.push({
                        key: item.key,
                        value: item.value ?? '',
                        updated_at: new Date().toISOString(),
                    });
                }
            }
        } else if (typeof payload === 'object' && payload !== null) {
            for (const [key, value] of Object.entries(payload)) {
                this.cache[key] = String(value ?? '');
                updates.push({
                    key,
                    value: String(value ?? ''),
                    updated_at: new Date().toISOString(),
                });
            }
        }

        if (updates.length > 0) {
            try {
                const client = this.supabaseService.getClient();
                const { error } = await client
                    .from('institution_settings')
                    .upsert(updates, { onConflict: 'key' });

                if (error) {
                    this.logger.warn(`Could not batch persist settings to DB: ${error.message}`);
                }
            } catch (err: any) {
                this.logger.warn(`Error batch updating settings: ${err.message}`);
            }
        }

        return { ...this.cache };
    }
}

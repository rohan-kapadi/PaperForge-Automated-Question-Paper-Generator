import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async getSettings(@Query('format') format?: string) {
        if (format === 'list') {
            return this.settingsService.getAll();
        }
        return this.settingsService.getSettingsMap();
    }

    @Patch()
    async updateSettings(@Body() body: any) {
        if (!body) {
            return this.settingsService.getSettingsMap();
        }

        // Support single key-value update: { key: "...", value: "..." }
        if (typeof body.key === 'string' && typeof body.value !== 'undefined') {
            await this.settingsService.update(body.key, String(body.value));
            return this.settingsService.getSettingsMap();
        }

        // Support nested settings object: { settings: { ... } }
        if (body.settings && typeof body.settings === 'object') {
            return this.settingsService.updateMany(body.settings);
        }

        // Support direct key-value map or array
        return this.settingsService.updateMany(body);
    }
}

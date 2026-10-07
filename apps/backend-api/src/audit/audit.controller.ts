import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AuditService, CreateAuditLogDto } from './audit.service';

@Controller('audit-logs')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    findAll(@Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.auditService.findAll(parsedLimit);
    }

    @Post()
    create(@Body() dto: CreateAuditLogDto) {
        return this.auditService.log(dto.action, dto.details, dto.user_id, dto.ip_address);
    }
}

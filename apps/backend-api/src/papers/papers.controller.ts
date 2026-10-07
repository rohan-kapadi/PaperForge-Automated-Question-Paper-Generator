import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { PapersService, GeneratePaperDto, UpdatePaperStatusDto, ReplaceQuestionDto } from './papers.service';

@Controller('papers')
export class PapersController {
    constructor(private readonly papersService: PapersService) { }

    @Post('generate')
    generate(@Body() dto: GeneratePaperDto) {
        return this.papersService.generate(dto);
    }

    @Get()
    findAll() {
        return this.papersService.findAll();
    }

    @Get('candidates')
    getCandidates(
        @Query('bankId') bankId?: string,
        @Query('marks') marks?: string,
        @Query('excludeIds') excludeIds?: string,
    ) {
        const parsedMarks = marks ? parseInt(marks, 10) : undefined;
        const parsedExclude = excludeIds ? excludeIds.split(',') : undefined;
        return this.papersService.getCandidates(bankId, parsedMarks, parsedExclude);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.papersService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdatePaperStatusDto) {
        return this.papersService.updateStatus(id, dto);
    }

    @Post(':id/replace')
    replaceQuestion(@Param('id') id: string, @Body() dto: ReplaceQuestionDto) {
        return this.papersService.replaceQuestion(id, dto);
    }
}
